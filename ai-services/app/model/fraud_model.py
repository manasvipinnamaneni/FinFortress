import os
import joblib
import pandas as pd

from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score
)


# =====================================================
# PROJECT PATHS
# =====================================================

# fraud_model.py
#     ↓
# model
#     ↓
# app
#     ↓
# ai-services
#     ↓
# major-project

CURRENT_FILE = os.path.abspath(__file__)

MODEL_FOLDER = os.path.dirname(
    os.path.dirname(CURRENT_FILE)
)

AI_SERVICES_FOLDER = os.path.dirname(
    MODEL_FOLDER
)

PROJECT_ROOT = os.path.dirname(
    AI_SERVICES_FOLDER
)

DATASET_PATH = os.path.join(
    PROJECT_ROOT,
    "datasets",
    "creditcard.csv"
)

TRAINED_MODEL_FOLDER = os.path.join(
    MODEL_FOLDER,
    "..",
    "trained_models"
)

MODEL_PATH = os.path.join(
    TRAINED_MODEL_FOLDER,
    "fraud_model.pkl"
)


# =====================================================
# DISPLAY PATHS
# =====================================================

print("\n======================================")
print("AI FRAUD DETECTION MODEL TRAINING")
print("======================================")

print("\nDataset path:")
print(DATASET_PATH)

print("\nModel path:")
print(MODEL_PATH)


# =====================================================
# LOAD DATASET
# =====================================================

print("\nLoading dataset...")

if not os.path.exists(DATASET_PATH):
    print("\nERROR: Dataset not found!")
    print("Expected location:")
    print(DATASET_PATH)
    exit()

df = pd.read_csv(DATASET_PATH)

print("\nDataset loaded successfully!")

print("Number of rows:", len(df))
print("Number of columns:", len(df.columns))


# =====================================================
# BASIC INFORMATION
# =====================================================

print("\nClass distribution:")

print(
    df["Class"].value_counts()
)


normal_count = (df["Class"] == 0).sum()
fraud_count = (df["Class"] == 1).sum()

print("\nNormal transactions:", normal_count)
print("Fraud transactions:", fraud_count)


# =====================================================
# SEPARATE FEATURES AND TARGET
# =====================================================

X = df.drop(
    "Class",
    axis=1
)

y = df["Class"]


# =====================================================
# TRAIN TEST SPLIT
# =====================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# =====================================================
# HANDLE CLASS IMBALANCE
# =====================================================

scale_pos_weight = (
    normal_count / fraud_count
)

print(
    "\nScale positive weight:",
    scale_pos_weight
)


# =====================================================
# CREATE XGBOOST MODEL
# =====================================================

print("\nCreating XGBoost model...")

model = XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=scale_pos_weight,
    objective="binary:logistic",
    eval_metric="logloss",
    random_state=42,
    n_jobs=-1
)


# =====================================================
# TRAIN MODEL
# =====================================================

print("\nTraining model...")
print("This may take a few minutes.\n")

model.fit(
    X_train,
    y_train
)

print("\nModel training completed!")


# =====================================================
# PREDICTION
# =====================================================

print("\nMaking predictions...")

y_probability = model.predict_proba(
    X_test
)[:, 1]

y_prediction = (
    y_probability >= 0.5
).astype(int)


# =====================================================
# MODEL EVALUATION
# =====================================================

print("\n======================================")
print("MODEL EVALUATION")
print("======================================")

print("\nClassification Report:\n")

print(
    classification_report(
        y_test,
        y_prediction
    )
)


print("\nConfusion Matrix:\n")

print(
    confusion_matrix(
        y_test,
        y_prediction
    )
)


roc_auc = roc_auc_score(
    y_test,
    y_probability
)

print(
    "\nROC-AUC Score:",
    roc_auc
)


# =====================================================
# SAVE MODEL
# =====================================================

os.makedirs(
    TRAINED_MODEL_FOLDER,
    exist_ok=True
)

joblib.dump(
    model,
    MODEL_PATH
)

print("\n======================================")
print("MODEL SAVED SUCCESSFULLY")
print("======================================")

print("\nSaved model:")
print(MODEL_PATH)