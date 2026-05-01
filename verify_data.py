"""
REAL DATA extracted from user's actual figures (C:\\Users\\HARI\\Downloads\\figs)

=== CAWT Normalized Confusion Matrix ===
              N      S      V      F      Q   (Predicted)
N (Normal)   0.99   0.01   0.00   0.00   0.00
S (Supra)    0.04   0.96   0.00   0.00   0.00
V (Vent)     0.00   0.00   0.99   0.01   0.00
F (Fusion)   0.07   0.00   0.04   0.88   0.00
Q (Unknown)  0.00   0.00   0.00   0.00   1.00

=== CAWT ROC Curves (AUC from legend) ===
N: AUC = 0.995
S: AUC = 0.979
V: AUC = 0.997
F: AUC = 0.963
Q: AUC = 0.999

=== Training Loss ===
X-axis: 0 to 80 epochs (FULL 80!)
Training converges ~epoch 60-70, validation loss ~0.27

=== Baseline Accuracy Comparison ===
WaveletCNN peaks ~0.895 after 4 epochs (shown in 5 steps)
Transformer peaks ~0.955 after 4 epochs

=== Wavelet CNN Validation (80 epochs) ===
Peak accuracy ~0.91 around epoch 40
Peak macro F1 ~0.87 (never hits 90% target)

=== Transformer Validation (80 epochs) ===
Peak accuracy ~0.955 around epoch 60 
Peak macro F1 ~0.93 (approaches but doesn't pass 95% target)

=== Baseline Confusion Matrices (Normalized) ===
WaveletCNN: N=0.98, S=0.00, V=0.39, F=0.00, Q=0.84
Transformer: N=0.99, S=0.45, V=0.81, F=0.08, Q=0.98
"""

import numpy as np

# ===== REAL CAWT CONFUSION MATRIX (normalized values from image) =====
# We need to reverse-engineer counts from the normalized values
# From Table II (class distribution), test set is 20% of total
# Total: 109,466 beats. The actual test split depends on code.
# Let me compute from normalized matrix

# Normalized confusion matrix from image:
cm_norm = np.array([
    [0.99, 0.01, 0.00, 0.00, 0.00],  # N
    [0.04, 0.96, 0.00, 0.00, 0.00],  # S
    [0.00, 0.00, 0.99, 0.01, 0.00],  # V
    [0.07, 0.00, 0.04, 0.88, 0.00],  # F (this is the real bottleneck!)
    [0.00, 0.00, 0.00, 0.00, 1.00],  # Q
])

# Per-class accuracy (diagonal of normalized CM)
class_names = ['N', 'S', 'V', 'F', 'Q']
print("=" * 60)
print("PER-CLASS ACCURACY (from REAL normalized confusion matrix)")
print("=" * 60)
for i, name in enumerate(class_names):
    acc = cm_norm[i, i] * 100
    print(f"  {name}: {acc:.0f}%")

# Weighted overall accuracy needs class proportions
# From class distribution: N=82.77%, S=2.54%, V=6.61%, F=0.73%, Q=7.35%
proportions = np.array([0.8277, 0.0254, 0.0661, 0.0073, 0.0735])
overall_acc = np.sum(proportions * np.diag(cm_norm)) * 100
print(f"\n  Weighted Overall Accuracy: {overall_acc:.2f}%")

# Simple average accuracy (if test set distribution matches)
# N*0.99 + S*0.96 + V*0.99 + F*0.88 + Q*1.00 weighted
print(f"  (This uses training set proportions as weights)")

# ROC AUC values (directly from image legend)
print("\n" + "=" * 60)
print("AUROC VALUES (from REAL ROC curve image)")
print("=" * 60)
roc_auc = {'N': 0.995, 'S': 0.979, 'V': 0.997, 'F': 0.963, 'Q': 0.999}
for name in class_names:
    print(f"  {name}: {roc_auc[name]:.3f}")
macro_auroc = np.mean(list(roc_auc.values()))
print(f"  Macro AUROC: {macro_auroc:.4f}")

# Baseline results from images
print("\n" + "=" * 60)
print("BASELINE RESULTS (from REAL images)")
print("=" * 60)
print("  WaveletCNN (from validation curves):")
print("    Peak Accuracy: ~90-91%")
print("    Peak Macro F1: ~85-87%")
print("    Confusion: S=0.00 (total failure), F=0.00 (total failure)")
print()
print("  Transformer (from validation curves):")
print("    Peak Accuracy: ~95-96%")
print("    Peak Macro F1: ~91-93%")
print("    Confusion: S=0.45, F=0.08 (poor)")
print()
print("  Training: Full 80 epochs (loss plot confirms this)")

# F1 estimation from confusion matrix
print("\n" + "=" * 60)
print("MACRO F1 ESTIMATION")
print("=" * 60)
print("  Cannot compute exact F1 from normalized CM alone.")
print("  Need test set sizes per class to get absolute counts.")
print("  But from ROC and CM, F-class is the weak link at 88%.")
print("  The 93.77% macro F1 from the original paper is plausible")
print("  given F=88% recall dragging down the average.")
