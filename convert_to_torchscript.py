"""
Convert CAWT model (.pth) to TorchScript (.pt) for Android deployment.

Run this script ONCE after training:
    python convert_to_torchscript.py

Output: cawt_mobile.pt   (~6.5 MB)
Then copy cawt_mobile.pt into:
    ECGClassifier/app/src/main/assets/
"""

import math
import torch
import torch.nn as nn
import torch.nn.functional as F
import os

# ─────────────────────────────────────────────
# CONFIG  (must match training exactly)
# ─────────────────────────────────────────────
CONFIG = {
    'in_channels': 1,
    'd_model': 128,
    'num_heads': 4,
    'num_layers': 3,
    'drop_path_rate': 0.15,
    'dropout': 0.25,
    'num_classes': 5,
    'input_length': 187,
}

PTH_PATH   = os.path.join(os.path.dirname(__file__), "cawt_best.pth")
OUT_PATH   = os.path.join(os.path.dirname(__file__), "cawt_mobile.pt")

# ─────────────────────────────────────────────
# Architecture (must be identical to training)
# ─────────────────────────────────────────────

class RoPE1D(nn.Module):
    def __init__(self, dim):
        super().__init__()
        inv_freq = 1.0 / (10000 ** (torch.arange(0, dim, 2).float() / dim))
        self.register_buffer('inv_freq', inv_freq)

    def forward(self, x):
        seq_len = x.size(1)
        t = torch.arange(seq_len, device=x.device).type_as(self.inv_freq)
        freqs = torch.einsum('i,j->ij', t, self.inv_freq)
        return torch.cat((freqs, freqs), dim=-1)

def apply_rotary(q, k, freqs):
    freqs = freqs.unsqueeze(0).unsqueeze(0)
    cos, sin = freqs.cos(), freqs.sin()
    def rotate_half(x):
        x1, x2 = x[..., :x.shape[-1]//2], x[..., x.shape[-1]//2:]
        return torch.cat((-x2, x1), dim=-1)
    return (q*cos)+(rotate_half(q)*sin), (k*cos)+(rotate_half(k)*sin)

class DropPath(nn.Module):
    def __init__(self, p=0.):
        super().__init__()
        self.p = p
    def forward(self, x):
        # Always disabled during eval (tracing uses eval mode)
        return x

class WaveletExtractor(nn.Module):
    def __init__(self, in_ch, d_model):
        super().__init__()
        sub = d_model // 4
        self.stem = nn.Conv1d(in_ch, d_model//2, 7, stride=2, padding=3)
        self.conv_hi = nn.Conv1d(d_model//2, sub, 3, padding=1)
        self.conv_md = nn.Conv1d(d_model//2, sub, 7, padding=3)
        self.conv_lo = nn.Conv1d(d_model//2, sub, 15, padding=7)
        self.conv_vl = nn.Conv1d(d_model//2, sub, 31, padding=15)
        self.bn1 = nn.BatchNorm1d(d_model)
        self.pool = nn.MaxPool1d(2)
        self.conv2_hi = nn.Conv1d(d_model, sub, 3, padding=1)
        self.conv2_md = nn.Conv1d(d_model, sub, 7, padding=3)
        self.conv2_lo = nn.Conv1d(d_model, sub, 15, padding=7)
        self.conv2_vl = nn.Conv1d(d_model, sub, 31, padding=15)
        self.bn2 = nn.BatchNorm1d(d_model)

    def forward(self, x):
        x = F.gelu(self.stem(x))
        x = F.gelu(self.bn1(torch.cat([self.conv_hi(x), self.conv_md(x), self.conv_lo(x), self.conv_vl(x)], 1)))
        x = self.pool(x)
        x = F.gelu(self.bn2(torch.cat([self.conv2_hi(x), self.conv2_md(x), self.conv2_lo(x), self.conv2_vl(x)], 1)))
        return x.permute(0, 2, 1)

class TimeExtractor(nn.Module):
    def __init__(self, in_ch, d_model):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv1d(in_ch, d_model//2, 7, stride=2, padding=3),
            nn.BatchNorm1d(d_model//2), nn.GELU(),
            nn.Conv1d(d_model//2, d_model, 5, padding=2),
            nn.BatchNorm1d(d_model), nn.GELU(),
            nn.MaxPool1d(2),
            nn.Conv1d(d_model, d_model, 3, padding=1),
            nn.BatchNorm1d(d_model), nn.GELU(),
        )
    def forward(self, x):
        return self.net(x).permute(0, 2, 1)

class CrossAttn(nn.Module):
    def __init__(self, d, h, drop=0.2):
        super().__init__()
        self.h, self.hd = h, d//h
        self.qkv = nn.ModuleList([nn.Linear(d, d) for _ in range(3)])
        self.out = nn.Linear(d, d)
        self.drop = nn.Dropout(drop)

    def forward(self, q, k, v, freqs=None):
        B, Lq, _ = q.shape
        _, Lk, _ = k.shape
        Q = self.qkv[0](q).view(B, Lq, self.h, self.hd).transpose(1,2)
        K = self.qkv[1](k).view(B, Lk, self.h, self.hd).transpose(1,2)
        V = self.qkv[2](v).view(B, Lk, self.h, self.hd).transpose(1,2)
        if freqs is not None:
            Q, K = apply_rotary(Q, K, freqs)
        s = torch.matmul(Q, K.transpose(-2,-1)) / math.sqrt(self.hd)
        a = self.drop(s.softmax(-1))
        return self.out(torch.matmul(a, V).transpose(1,2).contiguous().view(B, Lq, -1))

class CrossBlock(nn.Module):
    def __init__(self, d, h, dp=0.1, drop=0.2):
        super().__init__()
        self.n1q, self.n1kv = nn.LayerNorm(d), nn.LayerNorm(d)
        self.attn = CrossAttn(d, h, drop)
        self.dp = DropPath(dp)
        self.n2 = nn.LayerNorm(d)
        self.mlp = nn.Sequential(
            nn.Linear(d, d*4), nn.GELU(), nn.Dropout(drop),
            nn.Linear(d*4, d), nn.Dropout(drop)
        )
    def forward(self, q, kv, freqs=None):
        q = q + self.dp(self.attn(self.n1q(q), self.n1kv(kv), self.n1kv(kv), freqs))
        q = q + self.dp(self.mlp(self.n2(q)))
        return q

class CrossAttentiveWaveletTransformer(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        d   = cfg['d_model']
        h   = cfg['num_heads']
        n   = cfg['num_layers']
        dp_rate = cfg['drop_path_rate']
        drop    = cfg['dropout']

        self.wavelet = WaveletExtractor(cfg['in_channels'], d)
        self.time    = TimeExtractor(cfg['in_channels'], d)
        self.rope    = RoPE1D(d // h)

        dpr = [dp_rate * i / max(n-1, 1) for i in range(n)]

        self.w2t_layers = nn.ModuleList([CrossBlock(d, h, dpr[i], drop) for i in range(n)])
        self.t2w_layers = nn.ModuleList([CrossBlock(d, h, dpr[i], drop) for i in range(n)])

        self.norm = nn.LayerNorm(d * 2)
        self.head = nn.Sequential(
            nn.Linear(d * 2, d),
            nn.GELU(),
            nn.Dropout(drop),
            nn.Linear(d, cfg['num_classes'])
        )

    def forward(self, x):
        w = self.wavelet(x)
        t = self.time(x)
        freqs = self.rope(w)

        for w2t, t2w in zip(self.w2t_layers, self.t2w_layers):
            w_new = w2t(w, t, freqs)
            t_new = t2w(t, w, freqs)
            w, t = w_new, t_new

        w_pool = w.mean(dim=1)
        t_pool = t.mean(dim=1)
        fused  = torch.cat([w_pool, t_pool], dim=1)
        return self.head(self.norm(fused))


# ─────────────────────────────────────────────
# CONVERSION
# ─────────────────────────────────────────────
def convert():
    print("=" * 60)
    print("  CAWT → TorchScript Converter")
    print("=" * 60)

    # 1. Build model
    model = CrossAttentiveWaveletTransformer(CONFIG)
    print(f">> Model built  ({sum(p.numel() for p in model.parameters()):,} params)")

    # 2. Load weights
    assert os.path.exists(PTH_PATH), f"Cannot find: {PTH_PATH}"
    state = torch.load(PTH_PATH, map_location="cpu")
    model.load_state_dict(state)
    model.eval()
    print(f">> Weights loaded from: {PTH_PATH}")

    # 3. Quick sanity check
    with torch.no_grad():
        dummy = torch.randn(1, 1, 187)
        out   = model(dummy)
        probs = out.softmax(-1)
        print(f">> Sanity check: input {list(dummy.shape)} → output {list(out.shape)}")
        print(f"   Probabilities: {probs.squeeze().tolist()}")

    # 4. Trace to TorchScript
    with torch.no_grad():
        example_input  = torch.randn(1, 1, 187)
        traced_model   = torch.jit.trace(model, example_input)

    # 5. Validate traced model
    with torch.no_grad():
        out_traced = traced_model(example_input)
        out_orig   = model(example_input)
        max_diff   = (out_traced - out_orig).abs().max().item()
        print(f">> Max output difference (orig vs traced): {max_diff:.2e}  {'✓ OK' if max_diff < 1e-4 else '⚠ WARNING'}")

    # 6. Save
    traced_model.save(OUT_PATH)
    size_mb = os.path.getsize(OUT_PATH) / 1e6
    print(f"\n>> Saved: {OUT_PATH}")
    print(f"   File size: {size_mb:.1f} MB")
    print("\n✅ Done! Copy cawt_mobile.pt into:")
    print("   ECGClassifier/app/src/main/assets/cawt_mobile.pt")
    print("=" * 60)

if __name__ == "__main__":
    convert()
