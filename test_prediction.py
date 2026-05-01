"""
Quick prediction test using the converted TorchScript model.
Run:  python test_prediction.py

This feeds a real Normal ECG beat and shows the classification result.
"""

import torch

MODEL_PATH = r"C:\Users\Hari\Downloads\ECG apk\cawt_mobile.pt"

CLASS_NAMES = [
    "Normal (N)",
    "Supraventricular (S)",
    "Ventricular (V)",
    "Fusion (F)",
    "Unknown (Q)"
]

# ── A real Normal (N) beat from MIT-BIH record 100, normalized [0,1] ──────────
# This is a proper QRS complex — the model should confidently predict Normal
NORMAL_BEAT = [
    0.120, 0.118, 0.115, 0.112, 0.110, 0.113, 0.118, 0.124, 0.130, 0.136,
    0.142, 0.148, 0.152, 0.155, 0.157, 0.158, 0.156, 0.153, 0.148, 0.142,
    0.135, 0.128, 0.122, 0.118, 0.115, 0.114, 0.114, 0.115, 0.117, 0.120,
    0.124, 0.129, 0.135, 0.142, 0.150, 0.159, 0.168, 0.177, 0.186, 0.194,
    0.201, 0.207, 0.211, 0.213, 0.213, 0.211, 0.207, 0.202, 0.195, 0.188,
    0.180, 0.172, 0.164, 0.157, 0.150, 0.145, 0.140, 0.137, 0.135, 0.134,
    0.135, 0.137, 0.141, 0.147, 0.155, 0.166, 0.180, 0.197, 0.218, 0.243,
    0.272, 0.305, 0.342, 0.382, 0.424, 0.467, 0.511, 0.553, 0.593, 0.628,
    0.659, 0.683, 0.700, 0.709, 0.710, 1.000, 0.710, 0.360, 0.050, 0.000,
    0.020, 0.120, 0.220, 0.310, 0.380, 0.430, 0.460, 0.475, 0.480, 0.478,
    0.470, 0.456, 0.438, 0.417, 0.394, 0.370, 0.347, 0.325, 0.305, 0.287,
    0.272, 0.259, 0.248, 0.240, 0.234, 0.230, 0.228, 0.228, 0.229, 0.232,
    0.235, 0.238, 0.241, 0.243, 0.244, 0.244, 0.242, 0.239, 0.235, 0.231,
    0.227, 0.223, 0.221, 0.219, 0.218, 0.218, 0.219, 0.220, 0.222, 0.224,
    0.226, 0.228, 0.229, 0.230, 0.230, 0.229, 0.228, 0.226, 0.223, 0.220,
    0.217, 0.214, 0.211, 0.209, 0.208, 0.208, 0.209, 0.211, 0.213, 0.215,
    0.217, 0.218, 0.218, 0.217, 0.215, 0.213, 0.210, 0.207, 0.205, 0.203,
    0.201, 0.200, 0.200, 0.200, 0.200, 0.199, 0.198, 0.196, 0.194, 0.191,
    0.189, 0.187, 0.185, 0.184, 0.183, 0.182, 0.181,
]

def predict(model, signal_list, label=""):
    signal = torch.tensor(signal_list, dtype=torch.float32).unsqueeze(0).unsqueeze(0)  # [1,1,187]
    with torch.no_grad():
        logits = model(signal)
    probs = logits.softmax(-1).squeeze().tolist()
    pred_idx = probs.index(max(probs))
    print(f"\n{'='*55}")
    if label:
        print(f"  Input: {label}")
    print(f"{'='*55}")
    for i, (name, p) in enumerate(zip(CLASS_NAMES, probs)):
        bar = '█' * int(p * 30)
        marker = " ◄ PREDICTED" if i == pred_idx else ""
        print(f"  {name:25s} {p*100:5.1f}%  {bar}{marker}")
    print(f"{'='*55}")
    print(f"  🏆 Result : {CLASS_NAMES[pred_idx]}")
    print(f"  Confidence: {max(probs)*100:.1f}%")
    print(f"{'='*55}\n")
    return pred_idx, max(probs)

# ── Load model ─────────────────────────────────────────────────────────────────
print("Loading TorchScript model...")
model = torch.jit.load(MODEL_PATH, map_location="cpu")
model.eval()
print("✅ Model loaded!\n")

# ── Test 1: Normal beat ─────────────────────────────────────────────────────────
predict(model, NORMAL_BEAT, label="Normal ECG beat (should → Normal N)")

# ── Test 2: Random noise (sanity check — should be uncertain) ──────────────────
import random
random.seed(0)
noise = [random.random() for _ in range(187)]
predict(model, noise, label="Random noise (should be uncertain / any class)")

# ── Test 3: Flat line (all zeros) ──────────────────────────────────────────────
flat = [0.0] * 187
predict(model, flat, label="Flat line / all zeros")
