## 4.4 Wavelet Transform

The Wavelet Transform is a mathematical technique for decomposing a signal into components at different frequency scales while preserving time-domain information. Unlike the Fourier Transform, which provides only frequency information and loses temporal localization, wavelets simultaneously capture both time and frequency characteristics — making them particularly valuable for non-stationary signals like ECG.

### 4.4.1 Discrete Wavelet Transform (DWT)

The Discrete Wavelet Transform decomposes a signal into approximation coefficients (low-frequency components representing the overall trend) and detail coefficients (high-frequency components capturing transient features like QRS complexes). This decomposition is performed through a series of high-pass and low-pass filters applied at multiple levels.

At each decomposition level:
- The **low-pass filter** produces approximation coefficients — the smooth, slowly varying part of the signal
- The **high-pass filter** produces detail coefficients — the rapidly changing, transient features

The signal can be reconstructed from its wavelet coefficients using the **Inverse DWT (IDWT)**, which also allows noise reduction by thresholding the detail coefficients before reconstruction.

### 4.4.2 Multi-Resolution Analysis

Wavelet Transform provides multi-resolution analysis of ECG signals:

| Scale Level | Captures | ECG Relevance |
|-------------|----------|---------------|
| Fine scales (high frequency) | Rapid transitions, sharp peaks | QRS complex morphology, R-peak detection |
| Medium scales | Moderate variations | P-wave and T-wave shapes |
| Coarse scales (low frequency) | Slow trends | Baseline drift, heart rate variability |

This multi-resolution capability is critical for arrhythmia classification because different types of arrhythmias manifest at different frequency scales — ventricular arrhythmias produce wide, abnormal QRS complexes (captured at fine scales), while atrial fibrillation affects the P-wave region (captured at medium scales).

### 4.4.3 Advantages of Wavelet Transform for ECG

1. **Time-Frequency Localization:** Unlike Fourier Transform, wavelets pinpoint when specific frequency components occur in the signal, essential for detecting transient arrhythmic events.
2. **Multi-Scale Feature Extraction:** Different decomposition levels capture features at different resolutions, allowing the model to detect both short-duration abnormalities (PVCs) and long-duration rhythm disorders (AFib).
3. **Noise Robustness:** Wavelet denoising effectively separates signal from noise without distorting the underlying ECG morphology.
4. **Compact Representation:** Wavelet coefficients provide a compressed yet informative representation of the ECG signal, reducing computational complexity while preserving discriminative features.

### 4.4.4 Role in the CAWT Model

In the proposed CAWT architecture, the Wavelet Transform serves as a parallel feature extraction branch alongside the CNN. While the CNN extracts spatial and temporal features directly from raw ECG waveforms, the wavelet branch captures spectral characteristics through multi-level decomposition. These two complementary feature sets — temporal from CNN and spectral from wavelets — are then fused through cross-attention, enabling the model to leverage both time-domain morphology and frequency-domain dynamics for superior classification performance.

*Fig 4.5 Wavelet Transform Decomposition of ECG Signal*
