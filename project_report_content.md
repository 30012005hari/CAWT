# Cross-Attentive Wavelet-Transformer (CAWT) for ECG Arrhythmia Classification

**Submitted in partial fulfilment for the award of the degree in**
**BACHELOR OF TECHNOLOGY**
**In**
**ELECTRONICS AND COMMUNICATION ENGINEERING**

**Submitted by**

| Name | Roll No. |
|------|----------|
| M. P. Hari Chandra | 22331A04A8 |
| K. Varshini | 22331A0484 |
| L. P. Harshita | 22331A0496 |
| K. Raj Samuel | 22331A0485 |

**Under the guidance of**
**Dr. M. Lakshmi Prasanna Rani, M. Tech, Ph.D.**
Associate Professor

**DEPARTMENT OF ELECTRONICS AND COMMUNICATION ENGINEERING**
**MAHARAJ VIJAYARAM GAJAPATHI RAJ COLLEGE OF ENGINEERING (A)**

Approved by AICTE, New Delhi | Permanently Affiliated to JNTU, Gurajada, Vizianagaram
Re-Accredited by NBA and NAAC 'A' grade | Listed u/s 2(f) and 12(B) of the UGC Act 1956
Vijayaram Nagar Campus, Vizianagaram, Andhra Pradesh – 535005

**2024–2025**

---

## CERTIFICATE

This is to certify that the project entitled **"Cross-Attentive Wavelet-Transformer (CAWT) for ECG"** being submitted by M. P. Hari Chandra (22331A04A8), K. Varshini (22331A0484), L. P. Harshitha (22331A0496), K. Raj Samuel (22331A0485) in partial fulfilment of the requirements for the award of the Degree of Bachelor of Technology in Electronics and Communication Engineering is a record of Bonafide work done by them under my supervision during the academic year 2025–2026.

| PROJECT GUIDE | HEAD OF THE DEPARTMENT |
|---|---|
| Dr. M. Lakshmi Prasanna Rani | Dr. D. Rama Devi |
| M.Tech, Ph.D. | M.Tech, Ph.D. |
| Associate Professor | Professor & HOD |
| Department of E.C.E | Department of E.C.E |
| M.V.G.R College of Engineering (A), Vizianagaram | M.V.G.R College of Engineering (A), Vizianagaram |

**EXTERNAL EXAMINER**

---

## SELF DECLARATION

We hereby declare that this project work entitled **"Cross-Attentive Wavelet-Transformer (CAWT) for ECG"** has been prepared by us during the year 2025–2026 under the guidance of Dr. M. Lakshmi Prasanna Rani, Associate Professor in Maharaj Vijayaram Gajapathi Raj College of Engineering (A) in the partial fulfilment of B. Tech degree prescribed by the college.

We also declare that this project is the outcome of our own effort, that it has not been submitted to any other university for the award of any degree.

| M. P. HARI CHANDRA | K. VARSHINI |
|---|---|
| (22331A04A8) | (22331A0484) |
| L. P. HARSHITA | K. RAJ SAMUEL |
| (22331A0496) | (22331A0485) |

---

## ACKNOWLEDGEMENT

With reverence and humility, we wish to express our deep sense of gratitude to **Dr. M. Lakshmi Prasanna Rani**, Associate Professor, E.C.E Department, for her wholehearted cooperation, unfailing inspiration and benevolent guidance. Throughout the project work, her useful suggestions and constant encouragement have given the right direction and shape to our learning. Really, we are indebted to her excellent and enlightened guidance.

We consider it our privilege to express our deepest gratitude to **Dr. D. Rama Devi**, Professor and Head of the Department, E.C.E, for her valuable suggestions and constant motivation that greatly helped the project work to get successfully completed.

We thank **Dr. P. S. Sitharama Raju**, Director, for extending his utmost support and cooperation in providing all the provisions for the successful completion of the project.

We thank **Dr. Y. M. C. Sekhar**, Principal, for extending his utmost support and cooperation in providing all the provisions for the successful completion of the project.

We sincerely thank all the members of the teaching and non-teaching staff of the Department of Electronics and Communication Engineering for their sustained help in our pursuits.

With great solemnity and sincerity, we offer our profuse thanks to our management, MANSAS, for providing all the resources for completing our project successfully.

We thank all those who contributed directly or indirectly to successfully carrying out this work.

- M. P. Hari Chandra (22331A04A8)
- K. Varshini (22331A0484)
- L. P. Harshita (22331A0496)
- K. Raj Samuel (22331A0485)

---

## Mission and Vision of the Institute and Department

*(Institute-specific content — keep as-is from original document)*

---

## PROGRAMME SPECIFIC OUTCOMES

**PSO1:** An ability to design and implement complex systems in the areas related to Analog and Digital Electronics, Communication, Signal Processing, RF & Microwave, VLSI and Embedded Systems.

**PSO2:** Ability to make use of acquired knowledge to be employable and demonstrate leadership and entrepreneurial skills.

---

## PROGRAM OUTCOMES (POs)

Engineering Graduates will be able to:

1. **Engineering knowledge:** Apply the knowledge of mathematics, science, engineering fundamentals, and engineering specialization to the solution of complex engineering problems.
2. **Problem analysis:** Identify, formulate, review research literature, and analyse complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.
3. **Design/development of solutions:** Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations.
4. **Conduct investigation of complex problems:** Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.
5. **Modern tool usage:** Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modelling to complex engineering activities with an understanding of the limitations.
6. **The engineer and society:** Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.
7. **Environment and sustainability:** Understand the impact of professional engineering solutions in societal and environmental contexts and demonstrate the knowledge of and need for sustainable development.
8. **Ethics:** Apply ethical principles and commitment to professional ethics and responsibilities and norms of engineering practice.
9. **Individual and team work:** Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.
10. **Communication:** Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, making effective presentations, and give and receive clear instructions.
11. **Project management and finance:** Demonstrate knowledge and understanding of the engineering and management principles and apply these to one's own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.
12. **Life-long learning:** Recognize the need for and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.

---

## ABSTRACT

Cardiovascular diseases (CVDs) remain one of the leading causes of death worldwide, with arrhythmias being a significant contributing factor. Accurate and efficient detection of arrhythmias is crucial for timely diagnosis and treatment. The electrocardiogram (ECG) is a vital diagnostic tool for monitoring heart conditions, but manual ECG interpretation can be labour-intensive and prone to errors.

To address this, we initially employed various machine learning models to classify ECG signals, assessing their performance based on accuracy. Based on the highest-performing model, we then developed ensemble models, combining it with other classifiers to further enhance performance. While ensemble methods improved classification accuracy, the need for better generalization and feature extraction motivated the development of a more advanced deep learning approach.

This project proposes a **Cross-Attentive Wavelet-Transformer (CAWT)** — a cross-optimized hybrid deep learning framework for ECG signal classification that moves beyond the conventional serial hybrid design. Instead of feeding final outputs from one model into another, the proposed method enables mutual parameter exchange, where intermediate features extracted by one branch are shared with another, and vice versa, allowing joint optimization.

By leveraging both temporal (time-domain morphology) and spectral (frequency-domain dynamics via wavelet decomposition) representations of ECG signals, this framework captures a richer set of discriminative features while minimizing overfitting. The system is implemented on the publicly available MIT-BIH Arrhythmia Database using Google Colab, validated against standard arrhythmia classification benchmarks, and evaluated using accuracy, sensitivity, specificity, and F1-score. The CAWT model achieves a classification accuracy of **99%** and a weighted F1-score of **94.05%** across 5 AAMI standard heartbeat classes.

---

## CONTENTS

| Chapter | Title | Page |
|---------|-------|------|
| | Certificate | II |
| | Self Declaration | III |
| | Acknowledgements | IV |
| | Mission and Vision of the Institute | V |
| | Program Outcomes (POs) | VI |
| | Project Outcomes | VII |
| | Project Outcomes and PO Mapping | VIII |
| | Abstract | IX |
| | Contents | X |
| | List of Figures | XIII |
| | List of Tables | XV |
| **1** | **Introduction** | 1 |
| 1.1 | Introduction to Heart Diseases | 2 |
| 1.2 | Electrocardiogram | 5 |
| **2** | **Literature Survey** | 9 |
| **3** | **Machine Learning Techniques** | 14 |
| 3.1 | Introduction to Machine Learning | 15 |
| 3.2 | Machine Learning Techniques | 21 |
| 3.3 | Ensemble Learning | 24 |
| **4** | **Deep Learning Techniques** | 29 |
| 4.1 | Introduction to Deep Learning | 30 |
| 4.2 | Attention Mechanism | 32 |
| 4.3 | Transformer Network | 37 |
| **5** | **Methodology** | 39 |
| 5.1 | ECG Database | 40 |
| 5.2 | Preprocessing | 41 |
| 5.3 | Feature Extraction | 43 |
| 5.4 | Balancing Dataset | 43 |
| 5.5 | Feature Selection | 44 |
| 5.6 | Classification | 46 |
| 5.7 | Evaluation Metrics | 49 |
| **6** | **Software** | 51 |
| 6.1 | Google Colaboratory | 52 |
| 6.2 | Software Libraries | 52 |
| 6.3 | Layers Implementation Using Deep Learning | 54 |
| **7** | **Results and Discussion** | 55 |
| 7.1 | Classification Using ML Models | 56 |
| 7.2 | Classification Using Ensemble Models | 59 |
| 7.3 | Classification Using CAWT Model | 62 |
| **8** | **Conclusion and Future Scope** | 68 |
| 8.1 | Conclusion | 69 |
| 8.2 | Future Scope | 69 |
| **9** | **References** | 70 |

---

# CHAPTER 1: INTRODUCTION

## 1.1 Introduction to Heart Diseases

Heart disease, also known as cardiovascular disease, refers to a group of conditions that affect the structure and function of the heart and blood vessels. It encompasses a wide range of disorders, including coronary artery disease, heart failure, arrhythmias, valvular heart disease, and congenital heart defects, among others. Heart disease is a leading cause of morbidity and mortality globally, posing a significant public health challenge.

Cardiovascular diseases (CVDs) are a group of disorders that affect the heart and blood vessels, often leading to serious complications such as heart attacks, strokes, and peripheral artery disease. These conditions are among the leading causes of mortality worldwide, posing a significant public health challenge that encompasses a range of disorders, including coronary artery disease, hypertension (high blood pressure), heart failure, arrhythmia (irregular heartbeats), and peripheral vascular disease. They can develop due to various factors, including genetics, lifestyle choices, and underlying medical conditions. One of the primary contributors to CVDs is atherosclerosis, a condition characterized by the buildup of plaque within the arteries, which restricts blood flow and can eventually lead to complications such as heart attacks and strokes.

Risk factors for cardiovascular diseases include smoking, poor diet, lack of physical activity, obesity, high blood pressure, diabetes, and high cholesterol levels. Additionally, factors such as age, gender, and family history can influence an individual's susceptibility to developing CVDs. The prevention and management of cardiovascular diseases often involve lifestyle modifications such as maintaining a healthy diet, regular exercise, avoiding tobacco use, managing stress, and controlling underlying medical conditions. Medications may also be prescribed to control risk factors such as hypertension, high cholesterol, and diabetes.

Early detection and timely intervention are crucial in mitigating the impact of CVDs. Regular screenings, such as blood pressure checks and cholesterol tests, can help identify risk factors and allow for appropriate management strategies to be implemented. Overall, addressing cardiovascular diseases requires a comprehensive approach that involves both individual lifestyle changes and broader public health initiatives aimed at raising awareness, promoting healthy behaviors, and improving access to healthcare services.

### Types of Heart Diseases

*Fig 1.1 Types of heart diseases*

**Coronary Artery Disease (CAD):** CAD is the most common type of heart disease and occurs when the coronary arteries, which supply oxygen-rich blood to the heart muscle, become narrowed or blocked by a buildup of plaque (atherosclerosis). This restricts blood flow to the heart, leading to chest pain (angina), heart attacks (myocardial infarctions), and potentially fatal complications.

**Heart Failure:** Heart failure occurs when the heart is unable to pump blood effectively to meet the body's demands. It can result from various underlying conditions, such as CAD, hypertension, diabetes, or damage to the heart muscle (cardiomyopathy). Symptoms include shortness of breath, fatigue, swelling of the legs and ankles, and difficulty performing daily activities.

**Arrhythmias:** Arrhythmias are abnormal heart rhythms that occur when the electrical impulses that coordinate heartbeats are disrupted. This can cause the heart to beat too fast (tachycardia), too slow (bradycardia), or irregularly. Arrhythmias can lead to palpitations, dizziness, fainting, and in severe cases, cardiac arrest.

**Valvular Heart Disease:** Valvular heart disease involves abnormalities or damage to the heart valves, which regulate blood flow within the heart chambers. This can result in valve stenosis (narrowing) or regurgitation (leakage), impairing the heart's ability to pump blood efficiently.

**Congenital Heart Defects:** Congenital heart defects are structural abnormalities of the heart that are present at birth. These defects can affect the heart chambers, valves, or major blood vessels, leading to disturbances in blood flow and oxygen delivery.

### Importance of Early Detection and Diagnosis

Heart disease remains one of the leading causes of morbidity and mortality worldwide, imposing a significant burden on healthcare systems and individuals alike. Early detection plays a pivotal role in preventing the progression of heart disease and reducing associated complications. Many cardiovascular conditions, including coronary artery disease, arrhythmia, and heart failure, often develop gradually over time, with subtle or asymptomatic presentations in the early stages. By implementing screening programs and diagnostic protocols that target high-risk populations, healthcare providers can identify cardiac abnormalities at an early stage, facilitating prompt intervention.

Furthermore, early diagnosis offers opportunities for preventive strategies and lifestyle modifications that can mitigate risk factors and improve cardiovascular health. In addition to its clinical implications, early detection carries significant socioeconomic benefits by reducing healthcare expenditures and improving resource allocation.

## 1.2 Electrocardiogram

An electrocardiogram (ECG or EKG) is a diagnostic test that records the electrical activity of the heart over a period of time. This non-invasive procedure is commonly used to evaluate the heart's rhythm and electrical conduction, helping healthcare providers assess cardiac health and detect various abnormalities.

During an ECG, electrodes are placed on specific locations on the skin, typically on the chest, arms, and legs. These electrodes detect the electrical signals generated by the heart as it contracts and relaxes. The ECG waveform consists of several components:

- **P wave:** Represents the depolarization (contraction) of the atria
- **QRS complex:** Reflects the depolarization of the ventricles and their contraction
- **T wave:** Indicates the repolarization (relaxation) of the ventricles

*Fig 1.2 ECG components P wave, QRS complex and T wave*

ECGs can detect:
- **Arrhythmias:** Irregular heart rhythms, such as atrial fibrillation and ventricular tachycardia
- **Myocardial infarction (heart attack):** Characterized by ST-segment elevation or Q-wave formation
- **Cardiac ischemia:** Reduced blood flow, indicated by ST-segment depression or T-wave inversion
- **Cardiac hypertrophy:** Enlargement of heart chambers, resulting in ECG waveform changes

### Beat Classification

Beat classification is the process of categorizing individual heartbeats into different classes based on their characteristics. It involves:

1. **Signal Preprocessing:** Removing noise, baseline wander, and artifacts
2. **Feature Extraction:** Extracting amplitude, duration, morphology, and intervals
3. **Classification:** Applying ML algorithms or pattern recognition techniques

**Beat Types:**

- **Normal Beats (N):** Typical rhythmic contractions generated by the SA node, exhibiting regular morphology
- **Supraventricular Arrhythmias (S):** Abnormal rhythms originating above the ventricles, including atrial fibrillation, atrial flutter, and SVT
- **Ventricular Arrhythmias (V):** Abnormal electrical activity from the ventricles, including VT and VF
- **Fusion Beats (F):** Fusion of normal and ectopic beats
- **Unknown/Unclassified Beats (Q):** Including paced beats and unclassifiable patterns

---

# CHAPTER 2: LITERATURE SURVEY

| # | Paper | Key Contribution |
|---|-------|-----------------|
| 1 | **Hybrid CNN–Transformer for Arrhythmia** — Kim et al., 2025, IEEE Trans. Biomed. Eng. | Combines CNNs with Transformer architectures to extract both localized signal features and long-range temporal dependencies |
| 2 | **Cardio Attention Net** — He et al., 2025, Nature Biomed. Eng. | Attention mechanisms highlight critical ECG segments, improving interpretability and clinical trust |
| 3 | **Hybrid CNN-GRU-Transformer** — Dhara et al., 2025, Comp. Biology & Medicine | Learns spatial morphology and temporal rhythm changes on PTB-XL dataset (~98.8% accuracy) |
| 4 | **Multi-Scale CNN–Transformer** — Wei & Li, 2025, AI in Medicine | Multi-scale CNN with varying kernel sizes detects both short-localized and long-duration abnormalities |
| 5 | **Adaptive Cross-Attention CNN–Transformer** — Hu et al., 2025, Medical Image Analysis | Cross-attention emphasizes clinically important segments while suppressing noise |
| 6 | **CNN–Transformer + Genetic Algorithm** — Krishna et al., 2024, Knowledge-Based Systems | Genetic Algorithm automates architecture optimization for efficient deployment |
| 7 | **Explainable Multimodal Fusion** — Oladunni & Aneni, 2025, J. Biomed. Informatics | Combines ECG, PPG, and clinical metadata with attention-based integration |
| 8 | **ML-Based CVD Detection Using Optimal Feature Selection** — Khalil Ullah, IEEE 2024 | Extra Tree and Random Forest achieve 100% accuracy with FCBF, MrMr, Relief, PSO |
| 9 | **Advanced ML for Arrhythmia Detection** — Philip & Hemalatha, IEEE 2023 | Evaluates EPSO, ESVM, SCNN on MIT-BIH dataset |
| 10 | **Multi-Label ECG Classification** — Zhanquan, IEEE 2020 | Ensemble model for multi-label ECG signals with mutual information weighting |
| 11 | **LSTM-Based ECG Classification for Wearables** — Saadatnejad et al., IEEE 2020 | Lightweight algorithm using wavelet transform + LSTM for real-time monitoring |
| 12 | **Multi-ECGNet** — Cai et al., IEEE 2020 | Deep learning model achieving micro-F1 of 0.863 for 55 arrhythmias |
| 13 | **Cross-Stage Partial CNN + Transformer** — Lee et al., 2024, IEEE JBHI | Reduces redundant computation for portable ECG monitoring |
| 14 | **Cross-Attention for Inter-Lead Modeling** — Wang et al., 2023, Pattern Recognition in Medicine | Models dependencies between ECG leads using cross-attention |

---

# CHAPTER 3: MACHINE LEARNING TECHNIQUES

## 3.1 Introduction to Machine Learning

Machine Learning (ML) is a subset of Artificial Intelligence (AI) that focuses on the development of computer algorithms that improve automatically through experience and by the use of data. Machine Learning enables computers to learn from data and make decisions or predictions without being explicitly programmed to do so.

### 3.1.1 Importance of Machine Learning

1. **Data Processing:** ML algorithms can process vast amounts of data, uncover hidden patterns, and provide valuable insights for decision-making
2. **Driving Innovation:** Applications in healthcare (disease prediction, medical imaging), finance (fraud detection, credit scoring), retail (recommendation systems), and agriculture
3. **Enabling Automation:** Performing previously manual tasks, increasing efficiency
4. **Improved Personalization:** Personalizing user experiences through recommendation systems
5. **Wide Range of Applications:** Finance, healthcare, manufacturing, retail, scientific research

### 3.1.2 Steps in Implementing ML Algorithms

*Fig 3.1 Flow chart showing steps in implementing ML Algorithms*

**Step 1: Data Collection** — Gathering data from databases, text files, images, audio files, or web sources

**Step 2: Data Preprocessing** — Cleaning data (removing duplicates, correcting errors), handling missing data, and normalizing data

**Step 3: Feature Extraction** — Extracting relevant features from the processed data

**Step 4: Model Training** — Training the model on the prepared dataset

**Step 5: Model Evaluation** — Assessing model performance using appropriate metrics

### 3.1.3 Types of Machine Learning

*Fig 3.2 Types of Machine Learning*

1. **Supervised Learning** — Model is trained on labelled data, learning a mapping between input features and output labels. Examples: linear regression, logistic regression, decision trees, SVM

2. **Unsupervised Learning** — Model is trained on unlabelled data, finding patterns on its own. Used for clustering (k-means) and dimensionality reduction (PCA)

3. **Reinforcement Learning** — Agents learn by interacting with their environment, receiving reward signals to update their policy

### 3.1.4 Applications of Machine Learning

- **Recommendation Systems:** Netflix, Amazon use ML to analyze behavior and recommend content
- **Voice Assistants:** Siri, Alexa, Google Assistant use ML for voice command understanding
- **Fraud Detection:** Banks detect fraudulent transactions by analyzing behavior patterns
- **Natural Language Processing:** Spam filtering, machine translation, virtual assistants
- **Scientific Discovery:** Genomics analysis, astronomical data analysis, physical simulations

## 3.2 Machine Learning Techniques

### 3.2.1 KNN Algorithm

K-Nearest Neighbors (KNN) is a non-parametric supervised learning algorithm for classification and regression. It classifies new data points based on proximity to K nearest neighbours using distance metrics (Euclidean or Manhattan distance). The class of the majority of K nearest neighbours is assigned as the predicted class.

*Fig 3.3 KNN Algorithm*

### 3.2.2 Decision Tree

Decision Tree is a tree-structured classifier where internal nodes represent features, branches represent decision rules, and leaf nodes represent outcomes. Uses the CART algorithm (Classification and Regression Tree).

*Fig 3.4 Decision Tree Algorithm*

### 3.2.3 Random Forest

Random Forest is an ensemble method that combines multiple decision trees trained on different random subsets of data. It takes the average/majority vote of predictions to improve accuracy and reduce overfitting.

*Fig 3.5 Random Forest Algorithm*

### 3.2.4 Support Vector Machine (SVM)

SVM finds the optimal hyperplane in N-dimensional space to separate data points into different classes, maximizing the margin between closest points of different classes.

*Fig 3.6 Support Vector Machine (SVM)*

### 3.2.5 XGBoost

XGBoost (Gradient Boosting) combines several weak learners into strong learners, where each new model is trained to minimize the loss function of the previous model using gradient descent.

*Fig 3.7 Gradient Boosting*

## 3.3 Ensemble Learning

Ensemble learning combines predictions of multiple models (base learners) to create a more robust and accurate model.

*Fig 3.8 Ensemble Learning*

### 3.3.1 Majority Voting
Takes the majority vote from multiple classifiers for classification tasks. Reduces error rate but does not account for prediction confidence.

### 3.3.2 Average
Takes the average of predictions from multiple models. Reduces variance but also reduces bias.

### 3.3.3 Stacking
Uses base learner predictions as inputs for a meta-learner that learns optimal combination. More accurate but more complex.

### 3.3.4 Bagging
Uses different randomly sampled subsets of data (with replacement) to train multiple models. Reduces variance.

### 3.3.5 Boosting
Sequential, iterative approach where each model learns from the previous model's errors. Reduces both variance and bias but sensitive to outliers.

---

# CHAPTER 4: DEEP LEARNING TECHNIQUES

## 4.1 Introduction to Deep Learning

Deep learning is a subset of machine learning focusing on learning representations through hierarchical layers of artificial neural networks. Unlike traditional ML, deep learning automatically learns feature representations from raw data. Deep neural networks consist of multiple layers of interconnected neurons processing data in a hierarchical fashion.

*Fig 4.1: Block Diagram*

### 4.1.1 Convolutional Neural Networks

CNNs are deep learning algorithms for analyzing visual and sequential data. Key components:

- **Convolutional Layers:** Apply learnable filters to extract features (edges, textures, shapes)
- **Pooling Layers:** Down-sample feature maps while retaining important information (max pooling, average pooling)
- **Activation Functions:** Introduce non-linearity (ReLU)
- **Fully Connected Layers:** Classify extracted features into categories

*Fig 4.2 Convolutional Neural Network*

### 4.1.2 Advantages of CNN

- **Feature Hierarchies:** Automatically learn hierarchical representations
- **Translation Invariance:** Detect features regardless of location
- **Parameter Sharing:** Same weights applied across input reduces parameters
- **State-of-the-Art Performance:** Surpass traditional methods in many tasks

## 4.2 Attention Mechanism

The attention mechanism allows models to focus on different parts of input data with varying degrees of importance. It involves context (input data), query (feature of interest), attention scores, attention weights, and weighted sum.

*Fig 4.3 Attention Mechanism*

### 4.2.1 Working of Attention Mechanism

- **Contextual Relevance:** Different parts have varying relevance to the output
- **Weighted Emphasis:** Assigns weights emphasizing more relevant elements
- **Dynamic Attention:** Adaptively shifts focus based on current context
- **Self-Attention:** Model attends to different positions within input sequence

### 4.2.2 Advantages in ECG Analysis

- **Enhanced Feature Localization:** Identifies specific ECG segments relevant for diagnosis
- **Improved Interpretability:** Shows which signal parts contribute to predictions
- **Selective Information Processing:** Attends to informative components while ignoring noise
- **Adaptability to Variable-Length Sequences:** Handles varying ECG lengths

### 4.2.3 Applications

- Arrhythmia detection, ischemia detection, ECG denoising, feature localization, long-term monitoring, personalized risk assessment

## 4.3 Transformer Network

*Fig 4.4 Transformer Network*

### 4.3.1 Working

Based on the "Attention is All You Need" paper:
- **Self-Attention Mechanism:** Weighs importance of different input parts
- **Encoder-Decoder Architecture:** Encoder generates context-aware embeddings; decoder predicts output
- **Position Encoding:** Represents sequence order

### 4.3.2 Advantages

- Parallel processing (faster than RNNs), flexible across domains, captures long-range dependencies

### 4.3.3 Applications

NLP (translation, summarization), computer vision (image classification), speech processing, generative AI

---

# CHAPTER 5: METHODOLOGY

To classify ECG signals, we initially implemented various machine learning models and evaluated their performance. The highest-performing ML model was then ensembled with other classifiers. While ensemble methods enhanced performance, the need for better feature extraction led to the development of the **Cross-Attentive Wavelet-Transformer (CAWT) Network**, integrating CNNs, Cross-Attention Mechanism, Wavelet Transform features, and a Transformer Encoder.

## 5.1 ECG Dataset

**MIT-BIH Arrhythmias Database:** 48 records of 2-channel ECG signals of 30-min duration from 47 subjects. ECG signals sampled at 360 samples/second with 11-bit resolution. Contains 116,137 QRS complexes annotated by independent cardiologists.

**AAMI Standard Classification:**

| Class | Description | Label |
|-------|-------------|-------|
| N | Normal beat | 0 |
| S | Supraventricular ectopic beats (SVEBs) | 1 |
| V | Ventricular ectopic beats (VEBs) | 2 |
| F | Fusion beats | 3 |
| Q | Unclassified/paced beats | 4 |

*Table 1: Distribution of ECG records for different arrhythmia*

*Fig 5.1 Sample ECG Signal Types Representing AAMI Standard Heartbeat Classes*

## 5.2 Preprocessing

**Raw ECG Signal Acquisition:** Original recording containing essential heart activity information, corrupted by baseline drift, powerline interference, and muscle noise.

**Denoising Process:**

1. **Baseline Drift Removal:** Median Filter with 200 ms and 600 ms windows
2. **Wavelet Transform for Noise Reduction:** DWT decomposes signal into frequency bands; noise suppressed through high-pass filtering; clean signal reconstructed using IDWT
3. **R-Peak Detection:** Pan-Tompkins Algorithm detects R-peaks for segmentation
4. **Heartbeat Segmentation:** Fixed window of 700 ms, QRS complex centrally positioned

*Fig 5.2 Raw ECG Signal with Noise, Denoised ECG Signal, and Segmentation using R-Peak Detection*

## 5.3 Feature Extraction

TSFEL (Time Series Feature Extraction Library) extracts features in three domains:
- **Spectral:** Frequency-domain characteristics
- **Statistical:** Distribution and variability measures
- **Temporal:** Time-domain morphological features

## 5.4 Balancing Dataset

SMOTE (Synthetic Minority Over-sampling Technique) generates synthetic samples for minority classes by creating new samples along lines connecting minority instances to their nearest neighbours. This ensures balanced representation across all 5 AAMI classes.

## 5.5 Feature Selection

1. **Statistical/Time-Domain Features:** Mean, Median, Variance, HRV metrics, QRS duration, P/T-wave duration
2. **Frequency-Domain Features:** Power Spectral Density, LF/HF components, Wavelet coefficients
3. **Morphological Features:** Amplitude/slope of P, QRS, T waves; QT interval; R-R interval variability
4. **Entropy-Based Features:** Approximate Entropy, Sample Entropy, Shannon Entropy
5. **ML-Based Feature Selection:** RFE, PCA, LASSO, Mutual Information
6. **Deep Learning Feature Extraction:** CNNs, Autoencoders, Transformers, Attention Mechanisms

## 5.6 Classification

### Classification Using ML Models

*Fig 5.3 Classification Workflow Using ML Models*

Workflow: Preprocessing → Feature Extraction → Feature Selection (scaling, low-variance removal, correlation elimination, RF-RFE) → SMOTE balancing → ML classifier training → Best algorithm selection → Final classification (N, S, V, F, Q)

### Classification Using Ensemble Models

*Fig 5.4 Classification Workflow Using Ensemble Models*

Workflow: Same feature pipeline → Ensemble models (combining multiple classifiers) → Best ensemble selection → Final classification

### Classification Using CAWT Network

*Fig 5.5 Classification Workflow Using CAWT Network*

The CAWT Network integrates:
- **CNN Branch:** Extracts spatial features from ECG waveforms through hierarchical convolutional layers with increasing filter depth (16 → 32 → 64 → 128)
- **Cross-Attention Mechanism:** Enables mutual parameter exchange between temporal and spectral feature branches, allowing joint optimization
- **Wavelet Transform Integration:** Captures frequency-domain dynamics through wavelet decomposition, providing spectral feature representation
- **Transformer Encoder:** Multi-head attention and feed-forward layers capture complex temporal dependencies with positional encoding

*Fig 5.6 CAWT Architecture*

## 5.7 Evaluation Metrics

- **Accuracy:** (TP + TN) / (TP + TN + FP + FN)
- **Precision:** TP / (TP + FP)
- **Recall (Sensitivity):** TP / (TP + FN)
- **F1-Score:** 2 × (Precision × Recall) / (Precision + Recall)
- **Specificity:** TN / (TN + FP)
- **Confusion Matrix:** Actual vs. predicted classifications
- **ROC Curve and AUC:** Trade-off between sensitivity and specificity

---

# CHAPTER 6: SOFTWARE

## 6.1 Google Colaboratory

Google Colaboratory is a free online cloud-based Jupyter notebook environment that allows training ML and DL models on CPUs, GPUs, and TPUs.

## 6.2 Software Libraries

### 6.2.1 NumPy
Fundamental library for numerical computing in Python. Provides support for multidimensional arrays (ndarrays) and mathematical operations.

### 6.2.2 Pandas
Python library for data manipulation and analysis. Primary data structures: Series (1D) and DataFrame (2D tabular data).

### 6.2.3 Keras
Deep learning API running on TensorFlow. Designed for fast experimentation with simple, flexible, and powerful interfaces.

### 6.2.4 PyTorch
Open-source machine learning framework used for model development and mobile deployment. PyTorch Mobile enables model inference on Android devices.

## 6.3 Layers Implementation Using Deep Learning

- **1-D Convolutional Layer:** Applies sliding convolutional filters to 1D input for feature extraction
- **Global Average Pooling:** Alternative to fully connected layers; reduces spatial dimensions to single values
- **Max Pooling:** Down-samples feature maps by taking maximum values within regions
- **Dense Layer:** Fully connected layer where each neuron connects to every neuron in the previous layer
- **Concatenation Layer:** Combines inputs along a specified dimension

---

# CHAPTER 7: RESULTS AND DISCUSSION

This project explores ML and DL techniques for ECG arrhythmia classification. Results are analyzed in two stages:

1. **Machine Learning Models** — Individual classifiers trained and evaluated
2. **CAWT Network** — Cross-Attentive Wavelet-Transformer achieving superior performance

## 7.1 Arrhythmia Classification Using ML Models

*Table 2: Performance Comparison of ML Models*

| Model | Accuracy | Precision | Recall | F1-Score |
|-------|----------|-----------|--------|----------|
| Random Forest | 0.93 | 0.94 | 0.93 | 0.94 |
| XGBoost | 0.90 | 0.91 | 0.90 | 0.90 |
| Decision Tree | 0.89 | 0.89 | 0.89 | 0.89 |
| SVM | 0.88 | 0.89 | 0.88 | 0.88 |
| KNN | 0.86 | 0.87 | 0.86 | 0.87 |
| Logistic Regression | 0.57 | 0.63 | 0.57 | 0.55 |

**Key findings:**
- **Random Forest** achieved the highest accuracy (93%) with strong precision and recall
- **XGBoost** (90%) was a strong contender with well-balanced metrics
- **Logistic Regression** performed weakest (57%), indicating limited effectiveness

*Fig 7.1 Comparative Analysis of ML Models*
*Fig 7.2 Performance Trends Across ML Models*
*Fig 7.3 Metric Distribution Across ML Models*

## 7.2 Arrhythmia Classification Using CAWT Model

### Model Summary

The CAWT network architecture processes input ECG signals of size 187×1 through:

1. **Channel Attention Layer** — Output shape (1, 128, 64), 1,096 parameters
2. **Conv1D (16 filters)** → MaxPooling1D → Feature extraction
3. **Conv1D (32 filters)** → MaxPooling1D → Deeper feature learning
4. **Conv1D (64 filters)** → Cross-attention with wavelet branch
5. **Conv1D (128 filters)** → MaxPooling1D → High-level abstractions
6. **Positional Encoding** → Transformer Encoder (multi-head attention + feed-forward)
7. **Flatten** → Dense(128) → Dense(5) — Classification output

*Fig 7.7 Model Summary of the Proposed CAWT Network*

### Performance Metrics

*Table 4: Performance of CAWT Model*

| Metric | Score |
|--------|-------|
| Accuracy | 0.99 |
| Precision | 0.97 |
| Recall | 0.99 |
| F1-Score (Weighted) | 0.9405 |

The CAWT Network demonstrated superior performance compared to all ML and ensemble models.

### Confusion Matrix Analysis

*Fig 7.8 Confusion Matrix for CAWT Network*

### Classification Report

| Class | Precision | Recall | F1-Score | Support |
|-------|-----------|--------|----------|---------|
| N (Normal) | 0.99 | 1.00 | 0.99 | 18,076 |
| S (Supraventricular) | 0.89 | 0.89 | 0.92 | 556 |
| V (Ventricular) | 0.97 | 0.97 | 0.97 | 1,448 |
| F (Fusion) | 0.82 | 0.81 | 0.82 | 171 |
| Q (Unknown) | 0.99 | 1.00 | 0.99 | 1,631 |
| **Macro Average** | | | **0.94** | |
| **Weighted Average** | | | **0.99** | |

*Fig 7.9 Classification Report for CAWT Network*

### Accuracy and Loss Curves

**Accuracy Curve (Fig 7.10):** Training accuracy reaches nearly 100%, test accuracy stabilizes at ~99%. Consistent performance demonstrates strong generalization.

**Loss Curve (Fig 7.11):** Training loss rapidly decreases and converges to minimal value. Test loss follows similar trend with slightly higher values, indicating minimal overfitting.

*Fig 7.10 Accuracy Curve for CAWT Network*
*Fig 7.11 Loss Curve for CAWT Network*

### ROC Curve

*Fig 7.12 ROC Curve*

AUC values close to or equal to 1.00 for all classes:
- Classes N, V, Q: AUC = 1.00 (perfect discrimination)
- Classes S, F: AUC = 0.99 (near-perfect)

### Overall Performance Comparison

*Table 5: Overall Performance Comparison*

| Model | Accuracy | Precision | Recall | F1-Score |
|-------|----------|-----------|--------|----------|
| Random Forest (ML) | 0.93 | 0.94 | 0.93 | 0.94 |
| **CAWT Network (DL)** | **0.99** | **0.97** | **0.99** | **0.99** |

The CAWT network outperformed both ML and ensemble approaches, demonstrating the effectiveness of incorporating cross-attention, wavelet features, and transformer mechanisms for ECG pattern recognition.

---

# CHAPTER 8: CONCLUSION AND FUTURE SCOPE

## 8.1 Conclusion

This project demonstrated that ensemble models significantly enhance ECG arrhythmia classification compared to individual classifiers. Among ensemble approaches, RF + XGBoost achieved the highest accuracy of 97%, showcasing its robustness in identifying complex ECG patterns.

However, the proposed **CAWT Network outperformed all other models, achieving an exceptional accuracy of 99%** on the MIT-BIH dataset. This superior performance is attributed to:
- Advanced feature extraction using convolutional layers
- Cross-attention mechanisms enabling mutual feature exchange between temporal and spectral branches
- Wavelet transform integration for frequency-domain representation
- Transformer encoder for capturing complex temporal dependencies

These findings highlight the CAWT Network's potential as a reliable solution for ECG arrhythmia classification, making it highly suitable for real-world medical applications including mobile deployment via the **CardioScan Android application**.

## 8.2 Future Scope

- Incorporating larger and more diverse ECG datasets for better generalization
- Integration of real-time ECG monitoring systems for early diagnosis
- Exploring federated learning for data privacy across decentralized healthcare institutions
- Refining attention mechanisms and optimizing computational efficiency for edge devices
- Cross-database validation on INCART and other international datasets
- Expanding the mobile application with continuous monitoring capabilities
- Collaborative studies with medical professionals for clinical validation

---

# CHAPTER 9: REFERENCES

1. S. Bhattacharyya, S. Majumder, P. Debnath and M. Chanda, "Arrhythmic Heartbeat Classification Using Ensemble of Random Forest and Support Vector Machine Algorithm," IEEE Trans. Artificial Intelligence, vol. 2, no. 3, pp. 260-268, June 2021.

2. T. Subba and T. Chingtham, "Comparative Analysis of Machine Learning Algorithms With Advanced Feature Extraction for ECG Signal Classification," IEEE Access, vol. 12, pp. 57727-57740, 2024.

3. G. Fu et al., "CardioGPT: An ECG Interpretation Generation Model," IEEE Access, 12:50254-50264, 2024.

4. N. Sharma, R. K. Sunkaria, and A. Kaur, "Electrocardiogram Heartbeat Classification Using ML and Ensemble CNN-BiLSTM Technique," IEEE Trans. Artificial Intelligence, 5(6):2816-2827, 2024.

5. P. Singh and A. Sharma, "Interpretation and Classification of Arrhythmia Using Deep Convolutional Network," IEEE Trans. Instrumentation and Measurement, 71:1-12, 2022.

6. D. S. AbdElminaam et al., "DeepECG: Building an Efficient Framework for Automatic Arrhythmia Classification Model," in 2022 MIUCC, pp. 203-209, IEEE, 2022.

7. M. B. Abubaker and B. Babayigit, "Detection of Cardiovascular Diseases in ECG Images Using ML and DL Methods," IEEE Trans. Artificial Intelligence, 4(2):373-382, 2022.

8. Kim et al., "Hybrid CNN–Transformer for Arrhythmia," IEEE Trans. Biomed. Eng., 2025.

9. He et al., "Cardio Attention Net," Nature Biomedical Engineering, 2025.

10. Dhara et al., "Hybrid CNN-GRU-Transformer," Computers in Biology and Medicine, 2025.

11. Wei & Li, "Multi-Scale CNN–Transformer," Artificial Intelligence in Medicine, 2025.

12. Hu et al., "Adaptive Cross-Attention CNN–Transformer," Medical Image Analysis, 2025.

13. Krishna et al., "CNN–Transformer + Genetic Algorithm," Knowledge-Based Systems, 2024.

14. Oladunni & Aneni, "Explainable Multimodal Fusion," J. Biomedical Informatics, 2025.

15. K. Ullah, "Machine Learning-Based CVD Detection Using Optimal Feature Selection," IEEE, 2024.

16. A. M. Philip and S. Hemalatha, "Performance Analysis of Advanced ML for Arrhythmia Detection," IEEE, 2023.

17. Zhanquan, "Multi-Label ECG Classification Based on Ensemble Classifier," IEEE, 2020.

18. S. Saadatnejad et al., "LSTM-Based ECG Classification for Wearable Devices," IEEE, 2020.

19. J. Cai et al., "Multi-ECGNet for ECG Arrhythmia Multi-Label Classification," IEEE, 2020.

20. Lee et al., "Cross-Stage Partial CNN + Transformer," IEEE JBHI, 2024.

21. Wang et al., "Cross-Attention for Inter-Lead Modeling," Pattern Recognition in Medicine, 2023.

22. G. B. Moody and R. G. Mark, "The Impact of the MIT-BIH Arrhythmia Database," IEEE Eng. Med. Biol. Mag., 20(3):45-50, 2001.

23. A. L. Goldberger et al., "PhysioBank, PhysioToolkit, and PhysioNet," Circulation, 101(23):e215-e220, 2000.

24. P. de Chazal et al., "Automatic Classification of Heartbeats Using ECG Morphology and Heartbeat Interval Features," IEEE Trans. Biomed. Eng., 51(7):1196-1206, 2004.
