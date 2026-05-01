# CHAPTER 4: DEEP LEARNING TECHNIQUES

The CAWT (Cross-Attentive Wavelet-Transformer) model proposed in this project integrates four key deep learning components: Convolutional Neural Networks for spatial feature extraction, Wavelet Transform for spectral feature representation, Attention Mechanisms for focusing on critical signal segments, and Transformer Encoders for capturing long-range temporal dependencies. This chapter provides the theoretical foundation for each of these components.

---

## 4.1 Convolutional Neural Networks (CNN)

Convolutional Neural Networks are deep learning models originally designed for image analysis but widely adopted for 1D signal processing tasks such as ECG classification. CNNs excel at automatically learning hierarchical feature representations from raw data through successive layers of convolution and pooling operations.

### Architecture of a CNN

A typical CNN consists of the following layers:

**Convolutional Layer:** The core building block of a CNN. It applies a set of learnable filters (kernels) to the input, performing a convolution operation that slides the filter across the input and computes the dot product at each position. In 1D CNNs used for ECG signals, the filters slide along the time axis, extracting local patterns such as QRS morphology, P-wave shape, and ST-segment characteristics. Each convolutional layer produces feature maps that capture increasingly abstract representations of the input signal.

**Batch Normalization:** Normalizes the output of the convolutional layer to stabilize training and accelerate convergence. It reduces internal covariate shift by standardizing layer inputs to have zero mean and unit variance.

**Activation Function (ReLU):** The Rectified Linear Unit introduces non-linearity into the network by outputting max(0, x). This allows the network to learn complex, non-linear patterns in the data while avoiding the vanishing gradient problem common with sigmoid or tanh activations.

**Pooling Layer:** Reduces the spatial dimensions of feature maps while retaining the most important information. Max Pooling selects the maximum value within each pooling window, preserving dominant features. This reduces computational cost and provides translation invariance.

**Fully Connected (Dense) Layer:** After feature extraction through convolutional and pooling layers, the flattened feature maps are passed through dense layers for classification. Each neuron in a dense layer is connected to every neuron in the previous layer.

*Fig 4.1 Convolutional Neural Network*

### 1D CNN for ECG Signals

Unlike 2D CNNs used for images, 1D CNNs process sequential data by applying filters along a single axis (time). This makes them ideal for ECG signals, where temporal patterns (waveform shape, intervals, amplitude changes) are the primary discriminative features. In the CAWT model, a stack of four 1D convolutional layers with increasing filter depths (16 → 32 → 64 → 128) progressively extracts features from low-level morphological patterns to high-level representations of arrhythmic characteristics.

---

## 4.2 Wavelet Transform

The Wavelet Transform is a mathematical technique for decomposing a signal into components at different frequency scales while preserving time-domain information. Unlike the Fourier Transform, which provides only frequency information (losing temporal localization), wavelets simultaneously capture both time and frequency characteristics — making them particularly valuable for non-stationary signals like ECG.

### Discrete Wavelet Transform (DWT)

The Discrete Wavelet Transform decomposes a signal into approximation coefficients (low-frequency components representing the overall trend) and detail coefficients (high-frequency components capturing transient features like QRS complexes). This decomposition is performed through a series of high-pass and low-pass filters applied at multiple levels (scales).

At each decomposition level:
- The **low-pass filter** produces approximation coefficients — the smooth, slowly varying part of the signal
- The **high-pass filter** produces detail coefficients — the rapidly changing, transient features

The signal can be reconstructed from its wavelet coefficients using the **Inverse DWT (IDWT)**, which allows noise reduction by thresholding the detail coefficients before reconstruction.

### Multi-Resolution Analysis

Wavelet Transform provides multi-resolution analysis of ECG signals:

| Scale Level | Captures | ECG Relevance |
|-------------|----------|---------------|
| Fine scales (high frequency) | Rapid transitions, sharp peaks | QRS complex morphology, R-peak detection |
| Medium scales | Moderate variations | P-wave and T-wave shapes |
| Coarse scales (low frequency) | Slow trends | Baseline drift, heart rate variability |

This multi-resolution capability is critical for arrhythmia classification because different types of arrhythmias manifest at different frequency scales — ventricular arrhythmias produce wide, abnormal QRS complexes (captured at fine scales), while atrial fibrillation affects the P-wave region (captured at medium scales).

### Role in the CAWT Model

In the proposed CAWT architecture, the Wavelet Transform serves as a parallel feature extraction branch alongside the CNN. While the CNN extracts spatial/temporal features directly from raw ECG waveforms, the wavelet branch captures spectral characteristics through multi-level decomposition. These two complementary feature sets — temporal from CNN and spectral from wavelets — are then fused through cross-attention, enabling the model to leverage both time-domain morphology and frequency-domain dynamics for superior classification.

*Fig 4.2 Wavelet Transform Decomposition of ECG Signal*

---

## 4.3 Attention Mechanism

The Attention Mechanism enables deep learning models to dynamically focus on the most relevant parts of the input, rather than treating all parts equally. In ECG analysis, this means the model can learn to pay more attention to diagnostically critical segments (such as the QRS complex or ST-segment) while suppressing irrelevant regions and noise.

### Self-Attention

Self-attention (intra-attention) allows the model to compute relationships between all positions within a single input sequence. For each position in the sequence, it computes:

1. **Query (Q):** Represents "what am I looking for?"
2. **Key (K):** Represents "what do I contain?"
3. **Value (V):** Represents "what information do I carry?"

The attention score between two positions is the dot product of the Query from one position and the Key from another, scaled and normalized via softmax. The output is a weighted sum of Values, where the weights reflect the relevance of each position to every other position.

This mechanism captures long-range dependencies in ECG signals — for example, the relationship between the P-wave onset and the QRS complex, or between the ST-segment and T-wave, even when they are separated by many time steps.

### Cross-Attention

Cross-attention extends the attention mechanism to operate between two different input sequences or feature branches. Instead of computing Q, K, and V from the same input, the Query comes from one branch while the Key and Value come from a different branch.

**In the CAWT model, cross-attention is the key innovation:** The CNN branch provides temporal features, and the wavelet branch provides spectral features. Cross-attention allows each branch to query the other — the CNN features are refined by attending to relevant spectral information from the wavelet branch, and vice versa. This mutual feature exchange enables joint optimization of both branches, producing richer representations than either branch could achieve independently.

### Benefits for ECG Classification

- **Feature Localization:** Identifies and focuses on specific ECG segments relevant for diagnosis
- **Noise Suppression:** Selectively attends to informative components while ignoring artefacts
- **Interpretability:** Attention weights reveal which signal segments influenced the model's prediction, providing clinical transparency

*Fig 4.3 Attention Mechanism*

---

## 4.4 Transformer Network

The Transformer is a deep learning architecture introduced in the paper *"Attention is All You Need"* (Vaswani et al., 2017). Unlike recurrent neural networks (RNNs) that process sequences step-by-step, Transformers process entire sequences in parallel using self-attention, making them significantly faster and more effective at capturing long-range dependencies.

### Transformer Encoder Architecture

The CAWT model uses only the **encoder** portion of the Transformer (the decoder is used for sequence generation tasks like translation, which is not needed for classification). The Transformer Encoder consists of:

**1. Positional Encoding:** Since Transformers have no inherent notion of sequence order, positional encodings are added to the input embeddings to provide information about the position of each time step. For ECG signals, this preserves the temporal ordering of the waveform — the model knows which features come from the beginning, middle, or end of the heartbeat.

**2. Multi-Head Self-Attention:** Instead of computing a single attention function, multi-head attention runs multiple attention operations in parallel (each called a "head"). Each head learns to focus on different aspects of the input:
- One head might attend to QRS complex features
- Another might focus on P-wave to T-wave relationships
- A third might capture rhythm-level patterns

The outputs from all heads are concatenated and linearly projected to produce the final attention output.

**3. Feed-Forward Network:** After attention, each position passes through a two-layer feed-forward network with ReLU activation. This adds non-linearity and further transforms the attended features.

**4. Layer Normalization & Residual Connections:** Each sub-layer (attention and feed-forward) has a residual connection followed by layer normalization. Residual connections prevent the vanishing gradient problem in deep networks, while layer normalization stabilizes training.

### Why Transformers for ECG

Traditional approaches to ECG classification (RNNs, LSTMs) process signals sequentially, which limits their ability to capture relationships between distant time points and makes training slow. Transformers overcome these limitations:

| Property | RNN/LSTM | Transformer |
|----------|----------|-------------|
| Processing | Sequential | Parallel |
| Long-range dependencies | Difficult (vanishing gradient) | Excellent (direct attention) |
| Training speed | Slow | Fast |
| Scalability | Limited | Highly scalable |

### Role in the CAWT Model

In the CAWT architecture, the Transformer Encoder receives the fused features from the CNN and wavelet branches (after cross-attention) along with positional encoding. It applies multi-head self-attention to capture complex temporal dependencies across the entire heartbeat signal. The output is then flattened and passed through dense layers for final classification into the five AAMI arrhythmia classes.

*Fig 4.4 Transformer Network*

---

## 4.5 Summary: Integration in CAWT

The four techniques described in this chapter are not used independently — they are integrated into a unified architecture:

```
ECG Signal (187×1)
    │
    ├──→ [CNN Branch] → Temporal features
    │         ↕ Cross-Attention ↕
    ├──→ [Wavelet Branch] → Spectral features
    │
    └──→ [Fused Features] + Positional Encoding
              │
              ↓
        [Transformer Encoder]
              │
              ↓
        [Dense Layers] → Classification (N, S, V, F, Q)
```

This design enables the CAWT model to simultaneously capture spatial morphology (CNN), frequency-domain dynamics (Wavelet), inter-branch feature relationships (Cross-Attention), and long-range temporal dependencies (Transformer) — achieving 99% classification accuracy on the MIT-BIH dataset.
