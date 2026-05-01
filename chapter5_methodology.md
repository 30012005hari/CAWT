# CHAPTER 5: METHODOLOGY

This chapter describes the complete methodology followed in this project for ECG arrhythmia classification. The approach progresses through two stages: (1) baseline classification using individual ML models, and (2) the proposed Cross-Attentive Wavelet-Transformer (CAWT) deep learning network. The ML stage uses traditional feature engineering pipelines, while the CAWT model learns features directly from preprocessed ECG signals.

---

## 5.1 ECG Dataset

### MIT-BIH Arrhythmia Database

The MIT-BIH Arrhythmia Database is used as the primary data source. It comprises 48 records of 2-channel ECG signals, each 30 minutes in duration, obtained from 47 subjects between 1975 and 1979 at the Beth Israel Hospital (BIH) Arrhythmia Laboratory. Twenty-three recordings were selected randomly from a set of 4,000 ECG records, while the remaining 25 were specifically selected to include clinically significant arrhythmias.

**Recording specifications:**
- **Subjects:** 25 men (age 32–89) and 22 women (age 23–89)
- **Sampling rate:** 360 samples per second
- **Resolution:** 11-bit over a 10 mV range
- **Filtering:** Band-pass filtered at 0.1–100 Hz
- **Total QRS complexes:** 116,137
- **Annotation:** Each beat independently annotated by cardiologists for timing and class

### AAMI Standard Classification

The MIT-BIH heartbeat types are grouped according to the Association for the Advancement of Medical Instrumentation (AAMI) recommendation into five classes:

| Class | Label | Description | Beat Types Included |
|-------|-------|-------------|---------------------|
| N | 0 | Normal beat | Normal, LBBB, RBBB, Atrial escape, Nodal escape |
| S | 1 | Supraventricular ectopic beat (SVEB) | Atrial premature, Aberrated atrial premature, Nodal premature, Supra-ventricular premature |
| V | 2 | Ventricular ectopic beat (VEB) | Premature ventricular contraction, Ventricular escape |
| F | 3 | Fusion beat | Fusion of ventricular and normal |
| Q | 4 | Unknown/Unclassified beat | Paced, Fusion of paced and normal, Unclassifiable |

*Table 1: Distribution of ECG records for different arrhythmia of MIT-BIH database*

*Fig 5.1 Sample ECG Signal Types Representing AAMI Standard Heartbeat Classes*

---

## 5.2 Preprocessing

Raw ECG signals contain noise and artefacts that must be removed before classification. The preprocessing pipeline consists of three stages: denoising, R-peak detection, and heartbeat segmentation.

### 5.2.1 Denoising

**Baseline Drift Removal:**
A two-stage Median Filter is applied to correct baseline wander caused by patient movement and respiration:
- **200 ms window:** Removes sharp peaks (P-wave, QRS complex, T-wave), leaving the baseline trend
- **600 ms window:** Captures the overall slow-varying trend

The extracted baseline is subtracted from the original signal to produce a drift-free ECG.

**Wavelet Transform Noise Reduction:**
The Discrete Wavelet Transform (DWT) decomposes the signal into multiple frequency bands. High-frequency noise components (powerline interference at 50/60 Hz, muscle noise, motion artefacts) are suppressed by thresholding the DWT detail coefficients. The clean signal is reconstructed using the Inverse DWT (IDWT), preserving the diagnostically important ECG morphology while removing noise.

### 5.2.2 R-Peak Detection

The Pan-Tompkins Algorithm is used to detect R-peaks, which serve as reference points for heartbeat segmentation. The algorithm applies bandpass filtering, differentiation, squaring, and moving window integration to reliably identify QRS complexes. The detected R-peaks mark the centre of each heartbeat.

### 5.2.3 Heartbeat Segmentation

Each heartbeat is segmented within a fixed window centred on the detected R-peak. The final segmented signal consists of **187 samples per heartbeat**, capturing pre-QRS and post-QRS activity. This fixed-length representation ensures uniform input size for all subsequent classification models.

*Fig 5.2 Raw ECG Signal with Noise, Denoised ECG Signal, and Segmentation using R-Peak Detection*

---

## 5.3 Automatic Feature Learning

A core advantage of the proposed work is the elimination of manual feature engineering. While traditional systems rely on hand-crafted features (like TSFEL or statistical measures), this project implements **End-to-End Automatic Feature Learning** through the CAWT architecture.

### 5.3.1 Local Morphology Extraction
The convolutional layers in the Time-Domain branch serve as automated feature extractors. They learn "filters" that respond to specific ECG patterns such as the P-wave, QRS complex width, and T-wave inversion. These filters are optimized during training to select only the most discriminative morphological features.

### 5.3.2 Spectral Feature Learning
The Multi-Resolution Wavelet branch automatically decomposes the signal into different frequency scales using varied kernel sizes. This captures spectral features (frequency dynamics) automatically, identifying abnormalities in the signal's energy distribution without requiring manual wavelet coefficient selection.

### 5.3.3 Dynamic Importance Weighting (Attention)
The **Attention Mechanism** acts as a dynamic feature selector. For every heartbeat, the self-attention and cross-attention heads calculate "importance scores" for different segments of the signal. This ensures the model "selects" the most critical diagnostic windows while ignoring non-informative segments or noise.

---

## 5.4 Dataset Balancing Using SMOTE

The MIT-BIH dataset suffers from severe class imbalance — Normal beats (Class N) vastly outnumber minority classes like Fusion beats (Class F). This imbalance causes classifiers to be biased toward the majority class.

**SMOTE (Synthetic Minority Over-sampling Technique)** addresses this by generating synthetic samples for minority classes. For each minority sample, SMOTE:
1. Selects its K nearest neighbours within the same class
2. Generates new synthetic samples by interpolating between the original sample and its neighbours
3. Repeats until the class distribution is approximately balanced

This produces a balanced training set that allows models to learn discriminative patterns for all five AAMI classes equally, improving recall for rare but clinically critical arrhythmias (Classes S, F).

---

## 5.5 Classification

### 5.5.1 Classification Using ML Models

*Fig 5.3 Classification Workflow Using ML Models*

The ML models (Random Forest, XGBoost, etc.) serve as baselines. For these models, the raw 187-sample segments are flattened and fed directly into the classifiers after preprocessing and SMOTE balancing. This provides a direct comparison between traditional classifiers and the proposed deep learning network.
### 5.5.2 Classification Using CAWT Network

*Fig 5.5 Classification Workflow Using CAWT Network*

The CAWT (Cross-Attentive Wavelet-Transformer) network is the proposed deep learning model that surpasses both ML and ensemble approaches by learning features directly from preprocessed ECG signals.

#### CAWT Architecture

The model takes a **187×1 segmented heartbeat** as input and processes it through two parallel feature extraction branches that are fused via cross-attention before final classification.

**Branch 1 — CNN (Temporal Features):**

| Layer | Filters | Output Shape | Parameters |
|-------|---------|-------------|------------|
| Input | — | 187 × 1 | 0 |
| Conv1D + BN + ReLU | 16 | 187 × 16 | 64 |
| MaxPool1D | — | 93 × 16 | 0 |
| Conv1D + BN + ReLU | 32 | 93 × 32 | 1,568 |
| MaxPool1D | — | 46 × 32 | 0 |
| Conv1D + BN + ReLU | 64 | 46 × 64 | 6,208 |
| MaxPool1D | — | 23 × 64 | 0 |
| Conv1D + BN + ReLU | 128 | 23 × 128 | 24,704 |
| MaxPool1D | — | 11 × 128 | 0 |

The CNN branch progressively extracts temporal features from the raw waveform — low-level features (edges, peaks) in early layers evolving to high-level arrhythmia patterns in deeper layers.

**Branch 2 — Wavelet (Spectral Features):**

The input signal is decomposed using the Discrete Wavelet Transform at multiple scales. The wavelet coefficients (approximation and detail) are processed through a parallel set of convolutional layers to extract spectral feature representations.

**Cross-Attention Fusion:**

The CNN branch features serve as Query, and the Wavelet branch features serve as Key and Value (and vice versa). This enables:
- Temporal features to be enriched with frequency-domain context
- Spectral features to be refined with time-domain morphology
- Joint optimization of both branches through gradient flow

**Channel Attention Layer:**
An attention layer with 1,096 parameters applies channel-wise attention to emphasize the most informative feature channels while suppressing less relevant ones.

**Transformer Encoder:**

| Component | Description |
|-----------|-------------|
| Positional Encoding | Added to preserve temporal ordering of features |
| Multi-Head Self-Attention | Captures long-range dependencies across the heartbeat |
| Feed-Forward Network | Non-linear transformation of attended features |
| Layer Normalization | Stabilizes training |
| Residual Connections | Prevents vanishing gradients |

**Classification Head:**

| Layer | Neurons | Function |
|-------|---------|----------|
| Flatten | — | Reshapes transformer output to 1D |
| Dense + ReLU | 128 | Learns decision boundary |
| Dropout | 0.3 | Prevents overfitting |
| Dense + Softmax | 5 | Outputs class probabilities (N, S, V, F, Q) |

*Fig 5.6 CAWT Architecture*

#### Training Configuration

| Parameter | Value |
|-----------|-------|
| Optimizer | Adam |
| Learning Rate | 0.001 |
| Loss Function | Categorical Cross-Entropy |
| Batch Size | 128 |
| Epochs | 30 |
| Validation | Stratified K-Fold Cross-Validation |
| Early Stopping | Patience = 5 epochs (based on validation loss) |
| Data Augmentation | SMOTE applied to training folds only |

#### Mobile Deployment

The trained CAWT model is converted from PyTorch (.pth) to TorchScript (.pt) format using `torch.jit.trace` and optimized for mobile inference using `optimize_for_mobile`. The resulting model is deployed in an Android application (CardioScan) using the PyTorch Mobile runtime, enabling on-device ECG classification without requiring an internet connection.

---

## 5.6 Evaluation Metrics

The following metrics are used to evaluate all classification models:

**Accuracy:**
The ratio of correctly classified heartbeats to the total number of heartbeats.

$$Accuracy = \frac{TP + TN}{TP + TN + FP + FN}$$

**Precision (Positive Predictive Value):**
The proportion of positive predictions that are actually correct. High precision means fewer false alarms.

$$Precision = \frac{TP}{TP + FP}$$

**Recall (Sensitivity / True Positive Rate):**
The proportion of actual positive cases that are correctly identified. High recall means fewer missed detections — critical in clinical settings where missing an arrhythmia can be life-threatening.

$$Recall = \frac{TP}{TP + FN}$$

**F1-Score:**
The harmonic mean of precision and recall, providing a balanced measure especially useful for imbalanced datasets.

$$F1 = 2 \times \frac{Precision \times Recall}{Precision + Recall}$$

**Specificity (True Negative Rate):**
The proportion of actual negative cases correctly identified.

$$Specificity = \frac{TN}{TN + FP}$$

**Confusion Matrix:**
A matrix displaying actual vs. predicted class counts, revealing misclassification patterns between specific arrhythmia classes.

**ROC Curve and AUC:**
The Receiver Operating Characteristic curve plots True Positive Rate against False Positive Rate at various thresholds. The Area Under the Curve (AUC) quantifies overall discriminative ability, with AUC = 1.0 indicating perfect classification.
