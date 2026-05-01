import json

nb = json.load(open(r"C:\Users\Hari\Downloads\ECG apk\CAWT_v2_Best.ipynb"))
cells = nb["cells"]
print(f"Total cells: {len(cells)}\n")

all_src = ""
for c in cells:
    s = c["source"] if isinstance(c["source"], str) else "".join(c["source"])
    all_src += s

checks = [
    ("SMOTETomek import",         "SMOTETomek" in all_src),
    ("SMOTE runs ONCE not per-fold", "ONCE" in all_src),
    ("No WeightedRandomSampler",  "WeightedRandomSampler" not in all_src),
    ("torch.compile",             "torch.compile" in all_src),
    ("persistent_workers",        "persistent_workers" in all_src),
    ("pin_memory",                "pin_memory" in all_src),
    ("set_to_none=True",          "set_to_none=True" in all_src),
    ("GPU verification",          "cuda.is_available" in all_src),
    ("CrossBlock (cross-attn)",   "CrossBlock" in all_src),
    ("w2t + t2w bidirectional",   "w2t" in all_src and "t2w" in all_src),
    ("5-Fold StratifiedKFold",    "StratifiedKFold" in all_src),
    ("Test-Time Augmentation",    "tta" in all_src.lower()),
    ("CosineAnnealingWarmRestarts","CosineAnnealing" in all_src),
    ("FocalLoss + label smoothing","FocalLoss" in all_src),
    ("Mixup augmentation",        "mixup" in all_src.lower()),
    ("GradScaler (AMP/fp16)",     "GradScaler" in all_src),
    ("TorchScript export",        "jit.trace" in all_src),
]

print("CHECKLIST:")
for name, ok in checks:
    print(f"  [{'YES' if ok else 'NO ':3s}] {name}")

# Critical check: SMOTE NOT inside train_fold
fold_src = ""
for c in cells:
    s = c["source"] if isinstance(c["source"], str) else "".join(c["source"])
    if "def train_fold" in s:
        fold_src = s
        break

bad = "fit_resample" in fold_src or "SMOTETomek" in fold_src
print(f"\n  SMOTE inside train_fold: {'YES (BAD!)' if bad else 'NO (GOOD - will not hang)'}")

# Cell summary
print("\nCELL OUTLINE:")
for i, c in enumerate(cells):
    s = c["source"] if isinstance(c["source"], str) else "".join(c["source"])
    first_line = s.strip().split("\n")[0][:80]
    print(f"  Cell {i+1:2d} [{c['cell_type']:4s}] {first_line}")
