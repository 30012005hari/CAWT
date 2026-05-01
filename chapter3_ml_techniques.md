# CHAPTER 3: MACHINE LEARNING TECHNIQUES

## 3.1 Introduction to Machine Learning

Machine Learning (ML) is a subset of Artificial Intelligence (AI) that enables computers to learn patterns from data and make predictions without being explicitly programmed. In supervised learning—the approach used in this project—the model is trained on a labelled dataset, where each input sample has a corresponding known output class. The algorithm learns a mapping between input features and output labels, allowing it to predict the class of new, unseen data.

In the context of ECG arrhythmia classification, supervised ML models are trained on extracted features from pre-processed ECG signals to categorize heartbeats into five AAMI-standard classes: Normal (N), Supraventricular (S), Ventricular (V), Fusion (F), and Unknown (Q). Multiple classifiers are evaluated to identify the model that best captures the discriminative patterns in ECG signals.

The general workflow followed in this project is:

1. **Data Collection** — The MIT-BIH Arrhythmia Database is used as the source of labelled ECG recordings.
2. **Preprocessing** — Raw ECG signals are denoised using median filtering and wavelet transforms, then segmented into individual heartbeats using R-peak detection.
3. **Feature Extraction** — Time-domain, frequency-domain, and statistical features are extracted using the TSFEL library.
4. **Feature Selection** — Redundant and low-variance features are removed using Recursive Feature Elimination with Random Forest (RF-RFE).
5. **Data Balancing** — SMOTE is applied to generate synthetic samples for minority classes.
6. **Classification** — Multiple ML classifiers are trained and evaluated on the balanced feature set.

*Fig 3.1 Flow chart showing steps in implementing ML Algorithms*

---

## 3.2 Machine Learning Classifiers Used

### 3.2.1 K-Nearest Neighbors (KNN)

K-Nearest Neighbors is a non-parametric algorithm that classifies a new data point based on the majority class among its K closest neighbours in the feature space. The proximity is measured using a distance metric such as Euclidean distance. KNN does not make assumptions about the underlying data distribution, making it flexible for various types of classification tasks.

**Working:** For a test sample, KNN computes the distance to every training sample, selects the K nearest ones, and assigns the class that appears most frequently among them. In this project, KNN is used to classify ECG feature vectors, where each heartbeat is represented by its extracted features.

*Fig 3.2 KNN Algorithm*

### 3.2.2 Decision Tree

A Decision Tree is a tree-structured classifier where internal nodes represent feature-based decisions, branches represent decision rules, and leaf nodes represent class outcomes. The tree is built using the CART (Classification and Regression Tree) algorithm, which recursively splits the data at each node by selecting the feature that best separates the classes (measured by Gini impurity or information gain).

**Working:** Starting from the root node, each internal node poses a binary question about a feature value. The data is split at each node until leaf nodes are reached, each assigned to a class. Decision Trees are interpretable but can overfit if not pruned.

*Fig 3.3 Decision Tree Algorithm*

### 3.2.3 Random Forest

Random Forest is an ensemble method that constructs multiple decision trees, each trained on a different random subset of the training data (bootstrap sampling). The final prediction is determined by majority voting across all trees. This approach reduces overfitting and improves generalization compared to a single decision tree.

**Working:** Each tree in the forest independently classifies the input. The class that receives the most votes becomes the final prediction. By introducing randomness in both data sampling and feature selection at each split, Random Forest produces diverse trees that collectively make more accurate predictions.

In this project, **Random Forest achieved the highest accuracy (93%) among all individual ML models**, making it the base classifier for subsequent ensemble experiments.

*Fig 3.4 Random Forest Algorithm*

### 3.2.4 Support Vector Machine (SVM)

Support Vector Machine is a classifier that finds the optimal hyperplane in N-dimensional feature space to maximally separate data points of different classes. The hyperplane is positioned to maximize the margin—the distance between the hyperplane and the nearest data points (support vectors) from each class.

**Working:** For linearly separable data, SVM finds a straight decision boundary. For non-linear data, kernel functions (such as RBF or polynomial kernels) are used to map data into a higher-dimensional space where a linear separator can be found. SVM is effective in high-dimensional feature spaces and is robust against overfitting in such scenarios.

*Fig 3.5 Support Vector Machine (SVM)*

### 3.2.5 XGBoost (Extreme Gradient Boosting)

XGBoost is a gradient boosting algorithm that sequentially trains weak learners (typically decision trees), where each subsequent model is trained to correct the errors of the previous one. It minimizes a regularized loss function using gradient descent, adding penalty terms to prevent overfitting.

**Working:** At each iteration, XGBoost computes the gradient of the loss function with respect to the current ensemble's predictions and fits a new tree to this gradient. The prediction of the new tree is added to the ensemble with a learning rate, gradually improving the model. XGBoost includes built-in regularization (L1 and L2), making it less prone to overfitting than standard gradient boosting.

In this project, **XGBoost achieved 90% accuracy** and was later combined with Random Forest to form the best-performing ensemble model (97% accuracy).

*Fig 3.6 Gradient Boosting*

---


