# CAWT Mobile Model

Place the converted TorchScript model file here:

    cawt_mobile.pt

Steps to generate this file:
1. Run:  python convert_to_torchscript.py
2. The script produces `cawt_mobile.pt` next to `cawt_best.pth`
3. Copy `cawt_mobile.pt` into this folder (app/src/main/assets/)
4. Build the project in Android Studio

The model expects input shape: [1, 1, 187]
Output: 5-class softmax probabilities
  0 = Normal (N)
  1 = Supraventricular (S)
  2 = Ventricular (V)
  3 = Fusion (F)
  4 = Unknown (Q)
