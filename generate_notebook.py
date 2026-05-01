# coding: utf-8

Key fixes vs previous version:
  - SMOTE-Tomek runs ONCE on trainval (not inside each fold ->> was O(n?) per fold!)
  - T4 GPU warm-up cell added
  - num_workers=4 + persistent_workers + pin_memory for fast DataLoader
  - torch.compile() used when available (PyTorch 2.0+)
  - compile() with reduce-overhead mode for T4 kernel fusion
"""
import json

def code_cell(src):
    if not src.endswith("\n"):
        src += "\n"
    return {"cell_type": "code", "metadata": {}, "source": src,
            "outputs": [], "execution_count": None}

def md_cell(src):
    return {"cell_type": "markdown", "metadata": {}, "source": src.strip() + "\n"}

C = []

# ?? HEADER ????????????????????????????????????????????????????????????????????
C.append(md_cell("""
# ?? CAWT v2 Best - Fixed for T4 GPU Speed

**What changed from broken v1:**
| Issue | Fix |
|--|--|
| SMOTE-Tomek inside each fold (O(n?) ? 5 = hung for hours) | **Applied once before CV** |
| No GPU warm-up | **T4 GPU verified before training** |
| slow DataLoader | **num_workers=4 + persistent_workers + pin_memory** |
| No kernel fusion | **torch.compile() with reduce-overhead** |
"""))

# Cell 1
C.append(code_cell("""\
# Cell 1: Install dependencies
!pip install -q wfdb imbalanced-learn scikit-learn seaborn matplotlib
"""))

# Cell 2
C.append(code_cell("""\
# Cell 2: Mount Drive
from google.colab import drive
drive.mount('/content/drive')
"""))

# Cell 3: GPU CHECK - most important
C.append(code_cell("""\
# Cell 3: Verify T4 GPU (MUST show CUDA before proceeding)
import torch, subprocess

print('='*50)
print('GPU CHECK')
print('='*50)
if not torch.cuda.is_available():
    raise RuntimeError(
        '? NO GPU DETECTED!\\n'
        'Go to Runtime ->> Change runtime type ->> Hardware accelerator = GPU (T4)\\n'
        'Then Runtime ->> Restart session and run again.'
    )

print(f'? GPU : {torch.cuda.get_device_name(0)}')
print(f'? VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB')
print(f'? CUDA: {torch.version.cuda}')
print(f'? PyTorch: {torch.__version__}')

# Warm up GPU with a dummy operation
_ = torch.randn(1000, 1000, device='cuda') @ torch.randn(1000, 1000, device='cuda')
torch.cuda.synchronize()
print('? GPU warm-up complete!')
print('='*50)

DEVICE = 'cuda'
"""))

# Cell 4: Imports
C.append(code_cell("""\
# Cell 4: Imports
import os, glob, math, copy, time, gc, random
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torch.amp import autocast, GradScaler
from scipy import signal as scipy_signal
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.metrics import (accuracy_score, f1_score, roc_auc_score,
                             confusion_matrix, classification_report)
from imblearn.combine import SMOTETomek
import matplotlib.pyplot as plt
import seaborn as sns
import wfdb

SEED = 42
random.seed(SEED); np.random.seed(SEED)
torch.manual_seed(SEED); torch.cuda.manual_seed(SEED)
torch.backends.cudnn.benchmark = True  # Fastest convolution algorithm for fixed input size

# Suppress excessive warnings
import warnings; warnings.filterwarnings('ignore', category=UserWarning)
print('>> Imports done.')
"""))

# Cell 5: Config
C.append(code_cell("""\
# Cell 5: Configuration
CONFIG = {
    'path_mitbih'  : '/content/drive/MyDrive/mit-bih-arrhythmia-database-1.0.0',
    'input_length' : 187,
    'sampling_rate': 360,
    'num_classes'  : 5,

    # Architecture
    'in_channels'  : 1,
    'd_model'      : 128,
    'num_heads'    : 4,
    'num_layers'   : 3,
    'drop_path_rate': 0.15,
    'dropout'      : 0.25,

    # Training (tuned for T4)
    'batch_size'   : 512,     # T4 has 16GB - 512 is fast
    'epochs'       : 80,
    'max_lr'       : 3e-4,
    'min_lr'       : 1e-6,
    'T_0'          : 20,      # CosineAnnealingWarmRestarts period (epochs)
    'weight_decay' : 0.05,
    'label_smoothing': 0.1,
    'focal_gamma'  : 2.0,
    'patience'     : 20,
    'mixup_alpha'  : 0.3,
    'aug_prob'     : 0.5,
    'n_folds'      : 5,
    'tta_n'        : 10,      # Test-Time Augmentation passes at inference
    'num_workers'  : 4,       # T4 Colab has enough CPUs
}

AAMI_MAPPING = {
    'N':0,'L':0,'R':0,'e':0,'j':0,
    'A':1,'a':1,'J':1,'S':1,
    'V':2,'E':2,
    'F':3,
    '/':4,'f':4,'Q':4
}
CLASS_NAMES = ['Normal (N)','Supraventricular (S)','Ventricular (V)','Fusion (F)','Unknown (Q)']
print(f'>> Config loaded | batch={CONFIG["batch_size"]} | epochs={CONFIG["epochs"]} | folds={CONFIG["n_folds"]}')
"""))

# Cell 6: Beat extraction
C.append(code_cell("""\
# Cell 6: Beat Extraction
def extract_all_beats(base_path, sampling_rate=360, input_length=187):
    assert os.path.exists(base_path), f'Path not found: {base_path}'
    dat_files  = glob.glob(os.path.join(base_path, '*.dat'))
    record_ids = sorted(set([os.path.splitext(f)[0] for f in dat_files]))
    print(f'>> Found {len(record_ids)} records in {base_path}')

    beats, labels = [], []
    sb, sa = int(0.25*sampling_rate), int(0.27*sampling_rate)

    for rec_path in record_ids:
        try:
            rec = wfdb.rdrecord(rec_path)
            ann = wfdb.rdann(rec_path, 'atr')
            li  = rec.sig_name.index('II') if 'II' in rec.sig_name else 0
            sig = rec.p_signal[:, li]

            for i, peak in enumerate(ann.sample):
                sym = ann.symbol[i]
                if sym not in AAMI_MAPPING: continue
                l, r = peak - sb, peak + sa
                if l < 0 or r > len(sig): continue
                beat = sig[l:r]
                if len(beat) != input_length:
                    beat = scipy_signal.resample(beat, input_length)
                rng = beat.max() - beat.min()
                beat = (beat - beat.min()) / rng if rng > 1e-8 else np.zeros(input_length)
                beats.append(beat.astype(np.float32))
                labels.append(AAMI_MAPPING[sym])
        except Exception as e:
            print(f'   skip {rec_path}: {e}')

    X = np.array(beats, dtype=np.float32)
    y = np.array(labels, dtype=np.int64)
    c = np.bincount(y, minlength=5)
    print(f'>> Total: {len(X)} beats | N={c[0]} S={c[1]} V={c[2]} F={c[3]} Q={c[4]}')
    return X, y

X_all, y_all = extract_all_beats(CONFIG['path_mitbih'], CONFIG['sampling_rate'], CONFIG['input_length'])
"""))

# Cell 7: *** KEY FIX *** SMOTE-Tomek ONCE, then split once for test hold-out
C.append(md_cell("## ? Key Fix: SMOTE-Tomek Runs ONCE (not inside each fold)"))
C.append(code_cell("""\
# Cell 7: Hold-out test split + SMOTE-Tomek on trainval (runs ONCE)
# ?????????????????????????????????????????????????????????????????
# PREVIOUS BUG: SMOTE-Tomek was running inside each of 5 folds on 80K samples
#               ->> Tomek KNN is O(n?) ->> hung for 20+ minutes per fold
#
# FIX: Apply SMOTE-Tomek ONCE to the trainval set here,
#      then CV splits the pre-balanced data into train/val.
#      SMOTE-Tomek only runs once ->> minutes instead of hours.

# 1. Hold-out test set (10% - NEVER touched during training)
X_trainval, X_test, y_trainval, y_test = train_test_split(
    X_all, y_all, test_size=0.10, stratify=y_all, random_state=SEED)

c_tv = np.bincount(y_trainval, minlength=5)
c_te = np.bincount(y_test,      minlength=5)
print(f'>> Trainval pool : {len(X_trainval)} | N={c_tv[0]} S={c_tv[1]} V={c_tv[2]} F={c_tv[3]} Q={c_tv[4]}')
print(f'>> Test hold-out : {len(X_test)} | N={c_te[0]} S={c_te[1]} V={c_te[2]} F={c_te[3]} Q={c_te[4]}')

# 2. SMOTE-Tomek on trainval ONCE
#    (Tomek links removal is slow; doing it 5? inside folds would hang Colab)
print('\\n>> Applying SMOTE-Tomek to trainval (this runs ONCE, ~5-10 min)...')
t0 = time.time()
smt = SMOTETomek(random_state=SEED)
X_flat = X_trainval.reshape(len(X_trainval), -1)
X_bal_flat, y_bal = smt.fit_resample(X_flat, y_trainval)
X_bal = X_bal_flat.reshape(-1, CONFIG['input_length']).astype(np.float32)
y_bal = y_bal.astype(np.int64)

c_bal = np.bincount(y_bal, minlength=5)
print(f'>> Done in {time.time()-t0:.1f}s | {len(X_bal)} samples after SMOTE-Tomek')
print(f'   N={c_bal[0]} S={c_bal[1]} V={c_bal[2]} F={c_bal[3]} Q={c_bal[4]}')

# 3. Class weights for Focal Loss (from balanced distribution)
cw = 1.0 / (c_bal.astype(np.float32) + 1e-6)
cw = cw / cw.sum() * 5
CLASS_WEIGHTS_GLOBAL = torch.tensor(cw, dtype=torch.float32)
print(f'>> Focal Loss weights: {cw.round(3)}')
"""))

# Cell 8: Architecture
C.append(md_cell("## Model Architecture (`CrossAttentiveWaveletTransformer`)"))
C.append(code_cell("""\
# Cell 8: Full CAWT Architecture (bidirectional cross-attention preserved)

class RoPE1D(nn.Module):
    def __init__(self, dim):
        super().__init__()
        inv_freq = 1.0 / (10000 ** (torch.arange(0, dim, 2).float() / dim))
        self.register_buffer('inv_freq', inv_freq)
    def forward(self, x):
        t = torch.arange(x.size(1), device=x.device).type_as(self.inv_freq)
        freqs = torch.einsum('i,j->ij', t, self.inv_freq)
        return torch.cat((freqs, freqs), dim=-1)

def apply_rotary(q, k, freqs):
    freqs = freqs.unsqueeze(0).unsqueeze(0); cos, sin = freqs.cos(), freqs.sin()
    def rot(x): x1,x2=x[...,:x.shape[-1]//2],x[...,x.shape[-1]//2:]; return torch.cat((-x2,x1),-1)
    return (q*cos)+(rot(q)*sin), (k*cos)+(rot(k)*sin)

class DropPath(nn.Module):
    def __init__(self, p=0.): super().__init__(); self.p = p
    def forward(self, x):
        if self.p == 0 or not self.training: return x
        keep = 1-self.p
        return x * x.new_empty((x.shape[0],)+(1,)*(x.ndim-1)).bernoulli_(keep) / keep

class WaveletExtractor(nn.Module):
    def __init__(self, in_ch, d):
        super().__init__()
        sub = d // 4
        self.stem = nn.Conv1d(in_ch, d//2, 7, stride=2, padding=3)
        self.b1 = [nn.Conv1d(d//2,sub,k,padding=k//2) for k in [3,7,15,31]]
        self.b1 = nn.ModuleList(self.b1); self.bn1 = nn.BatchNorm1d(d); self.pool = nn.MaxPool1d(2)
        self.b2 = [nn.Conv1d(d,sub,k,padding=k//2) for k in [3,7,15,31]]
        self.b2 = nn.ModuleList(self.b2); self.bn2 = nn.BatchNorm1d(d)
    def forward(self, x):
        x = F.gelu(self.stem(x))
        x = F.gelu(self.bn1(torch.cat([b(x) for b in self.b1], 1)))
        x = self.pool(x)
        x = F.gelu(self.bn2(torch.cat([b(x) for b in self.b2], 1)))
        return x.permute(0,2,1)

class TimeExtractor(nn.Module):
    def __init__(self, in_ch, d):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv1d(in_ch,d//2,7,stride=2,padding=3), nn.BatchNorm1d(d//2), nn.GELU(),
            nn.Conv1d(d//2,d,5,padding=2),              nn.BatchNorm1d(d),     nn.GELU(),
            nn.MaxPool1d(2),
            nn.Conv1d(d,d,3,padding=1),                 nn.BatchNorm1d(d),     nn.GELU())
    def forward(self, x): return self.net(x).permute(0,2,1)

class CrossAttn(nn.Module):
    def __init__(self, d, h, drop=0.2):
        super().__init__(); self.h,self.hd=h,d//h
        self.qkv=nn.ModuleList([nn.Linear(d,d) for _ in range(3)])
        self.out=nn.Linear(d,d); self.drop=nn.Dropout(drop)
    def forward(self, q, k, v, freqs=None):
        B,Lq,_=q.shape; _,Lk,_=k.shape
        Q=self.qkv[0](q).view(B,Lq,self.h,self.hd).transpose(1,2)
        K=self.qkv[1](k).view(B,Lk,self.h,self.hd).transpose(1,2)
        V=self.qkv[2](v).view(B,Lk,self.h,self.hd).transpose(1,2)
        if freqs is not None: Q,K=apply_rotary(Q,K,freqs)
        a=self.drop((Q@K.transpose(-2,-1)/math.sqrt(self.hd)).softmax(-1))
        return self.out((a@V).transpose(1,2).contiguous().view(B,Lq,-1))

class CrossBlock(nn.Module):
    """Bidirectional cross-attention: wavelet <-> time domain talk every layer."""
    def __init__(self, d, h, dp=0.1, drop=0.2):
        super().__init__()
        self.n1q,self.n1kv=nn.LayerNorm(d),nn.LayerNorm(d)
        self.attn=CrossAttn(d,h,drop); self.dp=DropPath(dp)
        self.n2=nn.LayerNorm(d)
        self.mlp=nn.Sequential(nn.Linear(d,d*4),nn.GELU(),nn.Dropout(drop),nn.Linear(d*4,d),nn.Dropout(drop))
    def forward(self, q, kv, freqs=None):
        q=q+self.dp(self.attn(self.n1q(q),self.n1kv(kv),self.n1kv(kv),freqs))
        return q+self.dp(self.mlp(self.n2(q)))

class CrossAttentiveWaveletTransformer(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        d,h,n=cfg['d_model'],cfg['num_heads'],cfg['num_layers']
        dp,drop=cfg['drop_path_rate'],cfg['dropout']
        self.wavelet=WaveletExtractor(cfg['in_channels'],d)
        self.time   =TimeExtractor(cfg['in_channels'],d)
        self.rope   =RoPE1D(d//h)
        dpr=[dp*i/max(n-1,1) for i in range(n)]
        # w2t: wavelet queries time (wavelet learns from time domain)
        # t2w: time queries wavelet (time learns from frequency domain)
        self.w2t=nn.ModuleList([CrossBlock(d,h,dpr[i],drop) for i in range(n)])
        self.t2w=nn.ModuleList([CrossBlock(d,h,dpr[i],drop) for i in range(n)])
        self.norm=nn.LayerNorm(d*2)
        self.head=nn.Sequential(nn.Linear(d*2,d),nn.GELU(),nn.Dropout(drop),nn.Linear(d,cfg['num_classes']))

    def forward(self, x):
        w,t=self.wavelet(x),self.time(x)
        freqs=self.rope(w)
        # Bidirectional cross-talk: every layer, wavelet and time "talk" to each other
        for w2t,t2w in zip(self.w2t,self.t2w):
            w_new=w2t(w,t,freqs)    # wavelet attends to time
            t_new=t2w(t,w,freqs)    # time attends to wavelet
            w,t=w_new,t_new         # both update simultaneously
        return self.head(self.norm(torch.cat([w.mean(1),t.mean(1)],1)))

# Quick shape test
with torch.no_grad():
    _m=CrossAttentiveWaveletTransformer(CONFIG)
    _o=_m(torch.randn(2,1,187))
    assert _o.shape==(2,5)
    params=sum(p.numel() for p in _m.parameters() if p.requires_grad)
    print(f'>> CAWT OK | {params:,} params | output shape {list(_o.shape)}')
del _m,_o
"""))

# Cell 9: Loss + Augmentor + Dataset
C.append(code_cell("""\
# Cell 9: Focal Loss + Augmentations + Dataset

class FocalLossWithSmoothing(nn.Module):
    def __init__(self, num_classes, alpha, gamma=2.0, smoothing=0.1):
        super().__init__(); self.nc=num_classes; self.gamma=gamma; self.smoothing=smoothing
        self.register_buffer('alpha', alpha)
    def forward(self, logits, targets):
        with torch.no_grad():
            smooth=torch.full_like(logits, self.smoothing/(self.nc-1))
            smooth.scatter_(1, targets.unsqueeze(1), 1.0-self.smoothing)
        log_p=F.log_softmax(logits,-1)
        focal=(1.0-log_p.exp()).pow(self.gamma)
        loss=(-focal*log_p*smooth).sum(-1)
        return (loss*self.alpha[targets]).mean()

class SignalAugmentor:
    def __init__(self, prob=0.5): self.p=prob
    def __call__(self, x):
        if torch.rand(1)<self.p: x=x+torch.randn_like(x)*0.02          # gaussian noise
        if torch.rand(1)<self.p:                                          # baseline wander
            L=x.shape[-1]; t=torch.linspace(0,2*math.pi,L,device=x.device)
            x=x+(torch.sin(t*torch.rand(1,device=x.device)*3)*0.05).unsqueeze(0)
        if torch.rand(1)<self.p: x=x*(0.85+torch.rand(1,device=x.device)*0.30)  # amp scale
        if torch.rand(1)<self.p:                                          # cutout
            L=x.shape[-1]; cut=int(L*0.12)
            x[...,torch.randint(0,L-cut,(1,)).item():torch.randint(0,L-cut,(1,)).item()+cut]=0
        if torch.rand(1)<self.p:                                          # time shift
            x=torch.roll(x,torch.randint(-8,9,(1,)).item(),dims=-1)
        return x

def mixup_data(x, y, alpha=0.3):
    lam=np.random.beta(alpha,alpha) if alpha>0 else 1
    idx=torch.randperm(x.size(0),device=x.device)
    return lam*x+(1-lam)*x[idx], y, y[idx], lam

def mixup_criterion(crit, pred, ya, yb, lam):
    return lam*crit(pred,ya)+(1-lam)*crit(pred,yb)

def compute_metrics(y_true, y_pred, y_probs, nc=5):
    acc =accuracy_score(y_true,y_pred)
    f1m =f1_score(y_true,y_pred,average='macro',zero_division=0)
    try:    auroc=roc_auc_score(y_true,y_probs,multi_class='ovr')
    except: auroc=0.0
    cm=confusion_matrix(y_true,y_pred,labels=list(range(nc)))
    sens,spec=[],[]
    for i in range(nc):
        tp=cm[i,i]; fn=cm[i,:].sum()-tp; fp=cm[:,i].sum()-tp; tn=cm.sum()-tp-fp-fn
        sens.append(tp/(tp+fn+1e-9)); spec.append(tn/(tn+fp+1e-9))
    return acc,f1m,auroc,sens,spec

class ECGDataset(Dataset):
    def __init__(self, X, y):
        self.X=torch.tensor(X,dtype=torch.float32)
        self.y=torch.tensor(y,dtype=torch.long)
    def __len__(self): return len(self.y)
    def __getitem__(self, i): return self.X[i].unsqueeze(0), self.y[i]

print('>> Loss, Augmentor, Dataset ready.')
"""))

# Cell 10: Training function for ONE fold
C.append(code_cell("""\
# Cell 10: Single-fold Training Function

def train_one_fold(X_tr, y_tr, X_val, y_val, fold_idx, cfg):
    print(f'\\n  Fold {fold_idx} | Train={len(X_tr)} Val={len(y_val)}')

    # DataLoaders - persistent_workers avoids worker respawn overhead on T4
    tr_loader = DataLoader(ECGDataset(X_tr, y_tr),
                           batch_size=cfg['batch_size'], shuffle=True,
                           num_workers=cfg['num_workers'],
                           pin_memory=True, persistent_workers=True, prefetch_factor=2)
    vl_loader = DataLoader(ECGDataset(X_val, y_val),
                           batch_size=cfg['batch_size'], shuffle=False,
                           num_workers=cfg['num_workers'],
                           pin_memory=True, persistent_workers=True, prefetch_factor=2)

    model = CrossAttentiveWaveletTransformer(cfg).to(DEVICE)

    # torch.compile() gives ~20-30% speedup on T4 with PyTorch 2.x
    if hasattr(torch, 'compile'):
        try:
            model = torch.compile(model, mode='reduce-overhead')
            print(f'  >> torch.compile() enabled (PyTorch {torch.__version__})')
        except Exception as e:
            print(f'  >> torch.compile skipped: {e}')

    cw = CLASS_WEIGHTS_GLOBAL.to(DEVICE)
    criterion = FocalLossWithSmoothing(cfg['num_classes'], cw, cfg['focal_gamma'], cfg['label_smoothing'])
    optimizer = optim.AdamW(model.parameters(), lr=cfg['max_lr'], weight_decay=cfg['weight_decay'])
    scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(
        optimizer, T_0=cfg['T_0'], T_mult=1, eta_min=cfg['min_lr'])
    scaler    = GradScaler('cuda')
    augmentor = SignalAugmentor(cfg['aug_prob'])

    best_f1, best_state, pat = 0.0, None, 0
    history = {'train_loss':[], 'val_f1':[]}

    print(f'  >> Starting training loop...')
    for epoch in range(cfg['epochs']):
        t0=time.time()

        # ?? Train ???????????????????????????????????????????????????????????
        model.train(); tr_loss=0.0
        for x,y in tr_loader:
            x,y=x.to(DEVICE,non_blocking=True),y.to(DEVICE,non_blocking=True)
            x=augmentor(x)
            use_mix=np.random.rand()<0.4
            if use_mix: x,ya,yb,lam=mixup_data(x,y,cfg['mixup_alpha'])
            optimizer.zero_grad(set_to_none=True)   # set_to_none=True is faster than zero_grad()
            with autocast('cuda'):
                logits=model(x)
                loss=mixup_criterion(criterion,logits,ya,yb,lam) if use_mix else criterion(logits,y)
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer); nn.utils.clip_grad_norm_(model.parameters(),1.0)
            scaler.step(optimizer); scaler.update()
            tr_loss+=loss.item()*x.size(0)
        scheduler.step(); tr_loss/=len(tr_loader.dataset)

        # ?? Validate ????????????????????????????????????????????????????????
        model.eval(); preds,trues,probs_=[],[],[]
        with torch.no_grad():
            for x,y in vl_loader:
                x=x.to(DEVICE,non_blocking=True)
                with autocast('cuda'): logits=model(x)
                p=logits.float().softmax(1)
                probs_.extend(p.cpu().numpy()); preds.extend(p.argmax(1).cpu().numpy())
                trues.extend(y.numpy())
        acc,f1m,auroc,_,_=compute_metrics(np.array(trues),np.array(preds),np.array(probs_))
        history['train_loss'].append(tr_loss); history['val_f1'].append(f1m)

        elapsed=time.time()-t0
        lr=optimizer.param_groups[0]['lr']
        print(f'  Ep {epoch+1:3d}/{cfg["epochs"]} | TrL:{tr_loss:.4f} Acc:{acc*100:.1f}% '
              f'F1:{f1m*100:.2f}% AUROC:{auroc:.4f} LR:{lr:.2e} {elapsed:.1f}s')

        if f1m>best_f1:
            best_f1=f1m; best_state=copy.deepcopy(model.state_dict()); pat=0
            # Unwrap compiled model for saving
            state = model._orig_mod.state_dict() if hasattr(model, '_orig_mod') else model.state_dict()
            torch.save(state, f'cawt_v2_fold{fold_idx}.pth')
            print(f'  >>> NEW BEST F1={best_f1*100:.2f}% ->> cawt_v2_fold{fold_idx}.pth')
        else:
            pat+=1
            if pat>=cfg['patience']: print(f'  [early stop ep {epoch+1}]'); break

    model.load_state_dict(best_state)
    return model, best_f1, history
"""))

# Cell 11: 5-Fold CV on pre-balanced data
C.append(code_cell("""\
# Cell 11: 5-Fold Cross-Validation (on pre-balanced data - no SMOTE inside folds!)
# ?????????????????????????????????????????????????????????????????????????????
# X_bal / y_bal is already balanced by SMOTE-Tomek from Cell 7.
# Each fold just trains on a slice of this balanced dataset - fast!

skf = StratifiedKFold(n_splits=CONFIG['n_folds'], shuffle=True, random_state=SEED)
fold_models, fold_f1s, fold_histories = [], [], []

print('='*70)
print(f'5-FOLD CROSS-VALIDATION | {len(X_bal)} samples (post SMOTE-Tomek) | T4 GPU')
print('='*70)

for fold_idx, (tr_idx, val_idx) in enumerate(skf.split(X_bal, y_bal), 1):
    print(f'\\n{"="*55}')
    print(f'FOLD {fold_idx}/{CONFIG["n_folds"]}')
    print(f'{"="*55}')
    m, f1, h = train_one_fold(X_bal[tr_idx], y_bal[tr_idx],
                               X_bal[val_idx], y_bal[val_idx],
                               fold_idx, CONFIG)
    fold_models.append(m); fold_f1s.append(f1); fold_histories.append(h)
    gc.collect(); torch.cuda.empty_cache()

print('\\n' + '='*70)
print(f'ALL FOLDS DONE')
print(f'Per-fold F1: {[f"{f*100:.2f}%" for f in fold_f1s]}')
print(f'Mean F1    : {np.mean(fold_f1s)*100:.2f}% ? {np.std(fold_f1s)*100:.2f}%')
print('='*70)
"""))

# Cell 12: TTA + Ensemble Final Evaluation
C.append(code_cell("""\
# Cell 12: Final Evaluation - Ensemble (5 models) + TTA (?10 augmented passes)
tta_aug = SignalAugmentor(prob=0.6)

def predict_ensemble_tta(models, X, tta_n=10, batch_size=256):
    all_model_probs = []
    for m_idx, model in enumerate(models):
        model.eval(); mp=np.zeros((len(X),5),dtype=np.float64)
        # Clean pass
        with torch.no_grad():
            for s in range(0,len(X),batch_size):
                b=torch.tensor(X[s:s+batch_size],dtype=torch.float32).unsqueeze(1).to(DEVICE)
                with autocast('cuda'): logits=model(b)
                mp[s:s+batch_size]+=logits.float().softmax(1).cpu().numpy()
        # TTA passes
        for _ in range(tta_n):
            with torch.no_grad():
                for s in range(0,len(X),batch_size):
                    b=torch.tensor(X[s:s+batch_size],dtype=torch.float32).unsqueeze(1).to(DEVICE)
                    b=tta_aug(b)
                    with autocast('cuda'): logits=model(b)
                    mp[s:s+batch_size]+=logits.float().softmax(1).cpu().numpy()
        mp/=(tta_n+1); all_model_probs.append(mp)
        print(f'  Model {m_idx+1}/{len(models)} done')
    return np.mean(all_model_probs,axis=0)

print('>> Running Ensemble + TTA on hold-out test set...')
y_probs = predict_ensemble_tta(fold_models, X_test, tta_n=CONFIG['tta_n'])
y_pred  = y_probs.argmax(1)

acc,f1m,auroc,sens,spec = compute_metrics(y_test, y_pred, y_probs)
print('\\n' + '='*70)
print('FINAL RESULTS - 5-model Ensemble + TTA?10 (hold-out test)')
print('='*70)
print(f'Accuracy  : {acc*100:.2f}%')
print(f'Macro F1  : {f1m*100:.2f}%')
print(f'AUROC     : {auroc:.4f}')
for i,n in enumerate(CLASS_NAMES):
    print(f'  {n:25s}  Sens:{sens[i]*100:.1f}%  Spec:{spec[i]*100:.1f}%')
from sklearn.metrics import classification_report
print()
print(classification_report(y_test, y_pred, target_names=CLASS_NAMES, zero_division=0))
"""))

# Cell 13: Confusion Matrix
C.append(code_cell("""\
# Cell 13: Confusion Matrix
cm=confusion_matrix(y_test,y_pred); cm_n=cm.astype('float')/cm.sum(1,keepdims=True)
fig,axes=plt.subplots(1,2,figsize=(16,6))
sns.heatmap(cm,  annot=True,fmt='d',  cmap='Blues', xticklabels=CLASS_NAMES,yticklabels=CLASS_NAMES,ax=axes[0])
sns.heatmap(cm_n,annot=True,fmt='.2f',cmap='Greens',xticklabels=CLASS_NAMES,yticklabels=CLASS_NAMES,ax=axes[1])
axes[0].set_title('Counts'); axes[1].set_title('Normalized')
plt.suptitle(f'CAWT v2 | Macro F1={f1m*100:.2f}% | AUROC={auroc:.4f}',fontsize=13)
plt.tight_layout(); plt.show()
"""))

# Cell 14: F1 History
C.append(code_cell("""\
# Cell 14: Training History
colors=['#2196F3','#4CAF50','#FF9800','#F44336','#9C27B0']
fig,axes=plt.subplots(1,2,figsize=(16,5))
for i,(h,c) in enumerate(zip(fold_histories,colors)):
    axes[0].plot(h['train_loss'],color=c,alpha=0.8,label=f'Fold {i+1}')
    axes[1].plot(h['val_f1'],    color=c,alpha=0.8,label=f'Fold {i+1}')
axes[0].set_title('Train Loss'); axes[1].set_title('Val Macro F1')
for ax in axes: ax.legend(fontsize=8)
axes[1].axhline(0.90,color='red',linestyle='--',alpha=0.5)
plt.tight_layout(); plt.show()
print(f'>> Best single-fold F1: {max(fold_f1s)*100:.2f}%')
"""))

# Cell 15: Export
C.append(code_cell("""\
# Cell 15: Export best fold model for Android (TorchScript)
best_i = int(np.argmax(fold_f1s))
best_m = fold_models[best_i]

# Unwrap torch.compile wrapper if present
raw_model = best_m._orig_mod if hasattr(best_m, '_orig_mod') else best_m
raw_model.eval().cpu()

print(f'>> Best fold: {best_i+1} (F1={fold_f1s[best_i]*100:.2f}%)')
with torch.no_grad():
    dummy  = torch.randn(1,1,187)
    traced = torch.jit.trace(raw_model, dummy)
    assert traced(dummy).shape == (1,5)

traced.save('cawt_v2_mobile.pt')
print('>> ? Saved: cawt_v2_mobile.pt')
print('   Copy into: ECGClassifier/app/src/main/assets/cawt_mobile.pt')
"""))

# ?? Write notebook ?????????????????????????????????????????????????????????????
nb = {
    "nbformat": 4, "nbformat_minor": 5,
    "metadata": {
        "kernelspec": {"display_name":"Python 3","language":"python","name":"python3"},
        "language_info": {"name":"python","version":"3.10.0"},
        "accelerator": "GPU",
        "colab": {"provenance":[],"gpuType":"T4"}
    },
    "cells": C
}

out = r"C:\Users\Hari\Downloads\ECG apk\CAWT_v2_Best.ipynb"
with open(out, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)
print(f"? CAWT_v2_Best.ipynb regenerated at: {out}")
