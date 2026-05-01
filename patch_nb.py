import json

path = r"C:\Users\Hari\Downloads\ECG apk\CAWT_v2_Best.ipynb"
nb = json.load(open(path, encoding="utf-8"))

for c in nb["cells"]:
    s = c["source"]
    if "batch_size" in s and "CONFIG" in s and "num_workers" in s:
        s = s.replace("'batch_size'     : 512,", "'batch_size'     : 256,    # safe for free Colab RAM")
        s = s.replace("'epochs'         : 80,", "'epochs'         : 100,    # 100 epochs, GPU is fast")
        s = s.replace("'T_0'            : 20,", "'T_0'            : 25,     # cosine restart period")
        s = s.replace("'patience'       : 20,", "'patience'       : 15,     # early stop saves time")
        s = s.replace("'n_folds'        : 5,", "'n_folds'        : 3,      # 3 folds fits free Colab")
        s = s.replace("'num_workers'    : 4,", "'num_workers'    : 2,      # free Colab limited CPUs")
        s = s.replace("tuned for T4 16GB", "tuned for FREE Colab T4 (~4h session)")
        c["source"] = s
        print("Config patched")
        break

for c in nb["cells"]:
    s = c["source"]
    if "5-FOLD" in s or "5-model" in s:
        s = s.replace("5-FOLD", "3-FOLD")
        s = s.replace("5-model", "3-model")
        c["source"] = s

for c in nb["cells"]:
    s = c["source"]
    if "'#F44336', '#9C27B0'" in s:
        s = s.replace("'#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0'",
                       "'#2196F3', '#4CAF50', '#FF9800'")
        c["source"] = s

with open(path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print("Patched for free Colab: epochs=100, folds=3, batch=256, workers=2")
