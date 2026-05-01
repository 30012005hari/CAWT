## 5.1 ECG Dataset

### MIT-BIH Arrhythmia Database

The MIT-BIH Arrhythmia Database is used as the primary data source. It comprises 48 records of 2-channel ECG signals, each 30 minutes in duration, obtained from 47 subjects between 1975 and 1979 at the Beth Israel Hospital (BIH) Arrhythmia Laboratory. Twenty-three recordings were selected randomly from a set of 4,000 ECG records from inpatients and outpatients at Boston's Beth Israel Hospital, while the remaining 25 were specifically selected from the same set to include clinically significant arrhythmias. Twenty-five men (aged 32–89 years) and twenty-two women (aged 23–89 years) were selected. The database consists of 116,137 QRS complexes. The ECG signals were sampled at 360 samples per second with 11-bit resolution over a 10 mV range and band-pass filtered at 0.1–100 Hz. Each beat was independently annotated by cardiologists for both timing and beat class information.

The database files are stored in **WFDB (WaveForm DataBase) format**, consisting of:
- **.dat files** — containing the raw digitized ECG signal data (binary format)
- **.hea files** — header files specifying signal parameters (sampling rate, resolution, lead configuration, patient information)
- **.atr files** — annotation files containing R-peak locations and beat class labels assigned by cardiologists

The .dat files are read programmatically using the **WFDB Python library** (`wfdb.rdrecord` for signal data and `wfdb.rdann` for annotations). Lead II is preferentially selected when available, as it provides the clearest P-QRS-T morphology for arrhythmia analysis.

*Table 1: Distribution of ECG records for different arrhythmia of MIT-BIH database*

| Beat Type | Record Numbers |
|-----------|---------------|
| Normal beats | 100, 101, 103, 105, 108, 112, 113, 114, 115, 117, 121, 122, 123, 202, 205, 219, 230, 234 |
| LBBB beats | 109, 111, 207, 214 |
| RBBB beats | 118, 124, 212, 231 |
| PVC beats | 106, 116, 119, 200, 201, 203, 208, 213, 221, 228, 233 |
| APB beats | 209, 220, 222, 223, 232 |

### AAMI Standard Classification

The individual MIT-BIH beat annotations are mapped to five superclasses according to the Association for the Advancement of Medical Instrumentation (AAMI) recommendation (ANSI/AAMI EC57). It emphasizes the problem of classifying ventricular ectopic beats (VEBs) from non-ventricular ectopic beats.

| AAMI Class | Label | Description | MIT-BIH Symbols Included |
|------------|-------|-------------|--------------------------|
| N | 0 | Normal | N (Normal), L (LBBB), R (RBBB), e (Atrial escape), j (Nodal escape) |
| S | 1 | Supraventricular ectopic beat | A (Atrial premature), a (Aberrated atrial premature), J (Nodal premature), S (Supraventricular premature) |
| V | 2 | Ventricular ectopic beat | V (PVC), E (Ventricular escape) |
| F | 3 | Fusion beat | F (Fusion of ventricular and normal) |
| Q | 4 | Unknown / Unclassified | / (Paced), f (Fusion of paced and normal), Q (Unclassifiable) |

Beat symbols not present in this mapping table are discarded during extraction.

*Fig 5.1 Sample ECG Signal Types Representing AAMI Standard Heartbeat Classes*

### Class Distribution and Imbalance

The extracted dataset exhibits severe class imbalance, which is characteristic of real-world ECG data — normal heartbeats vastly outnumber arrhythmic beats:

| Class | Name | Count | Percentage |
|-------|------|-------|------------|
| N | Normal | 90,606 | 82.77% |
| S | Supraventricular | 2,781 | 2.54% |
| V | Ventricular | 7,235 | 6.61% |
| F | Fusion | 802 | 0.73% |
| Q | Unknown | 8,042 | 7.35% |
| | **Total** | **1,09,466** | **100%** |

This imbalance is addressed using SMOTE oversampling (Section 5.4), which is applied only to the training set after the train-validation split to prevent data leakage.
