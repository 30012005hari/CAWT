"""
Convert .pth (PyTorch weights) → .pt (TorchScript) for Android deployment.

Usage:
    1. Put your model class definition below (or import it)
    2. Set the paths and input shape
    3. Run: python convert_pth_to_pt.py
"""

import torch
import torch.nn as nn

# ══════════════════════════════════════════════════════════════════════════════
# STEP 1: Define your model class here (or import it)
# ══════════════════════════════════════════════════════════════════════════════
# Example — replace this with your friend's actual model:
#
# class MyModel(nn.Module):
#     def __init__(self):
#         super().__init__()
#         self.conv1 = nn.Conv1d(1, 32, 5)
#         self.fc = nn.Linear(32, 5)
#
#     def forward(self, x):
#         x = self.conv1(x)
#         x = x.mean(dim=-1)
#         x = self.fc(x)
#         return x

# ══════════════════════════════════════════════════════════════════════════════
# STEP 2: Set paths and input shape
# ══════════════════════════════════════════════════════════════════════════════
PTH_PATH = "model.pth"            # Path to the .pth weights file
OUTPUT_PATH = "model_mobile.pt"   # Output TorchScript file
INPUT_SHAPE = (1, 1, 187)         # (batch, channels, signal_length) — adjust!
NUM_CLASSES = 5                   # Number of output classes

# ══════════════════════════════════════════════════════════════════════════════
# STEP 3: Convert (don't change anything below unless needed)
# ══════════════════════════════════════════════════════════════════════════════
def convert():
    # Create model instance
    model = MyModel()  # <-- Change this to your model class name
    
    # Load weights
    state_dict = torch.load(PTH_PATH, map_location="cpu")
    
    # Handle common state_dict wrapper keys
    if "model_state_dict" in state_dict:
        state_dict = state_dict["model_state_dict"]
    elif "state_dict" in state_dict:
        state_dict = state_dict["state_dict"]
    
    # Remove 'module.' prefix if saved from DataParallel
    cleaned = {}
    for k, v in state_dict.items():
        cleaned[k.replace("module.", "")] = v
    
    model.load_state_dict(cleaned, strict=False)
    model.eval()
    
    # Create dummy input
    dummy = torch.randn(*INPUT_SHAPE)
    
    # Trace the model
    print(f"Tracing model with input shape {INPUT_SHAPE}...")
    traced = torch.jit.trace(model, dummy)
    
    # Verify output
    with torch.no_grad():
        out = traced(dummy)
        print(f"Output shape: {out.shape}")
        print(f"Output classes: {out.shape[-1]}")
    
    # Optimize for mobile
    from torch.utils.mobile_optimizer import optimize_for_mobile
    optimized = optimize_for_mobile(traced)
    optimized._save_for_lite_interpreter(OUTPUT_PATH)
    
    print(f"\n✅ Saved to: {OUTPUT_PATH}")
    print(f"   Size: {os.path.getsize(OUTPUT_PATH) / 1024 / 1024:.1f} MB")

import os
convert()
