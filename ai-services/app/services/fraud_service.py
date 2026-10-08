import os
import joblib
import pandas as pd


# =====================================================
# FIND PROJECT PATH
# =====================================================

CURRENT_FILE = os.path.abspath(__file__)

# services
SERVICES_FOLDER = os.path.dirname(CURRENT_FILE)

# app
APP_FOLDER = os.path.dirname(SERVICES_FOLDER)

# ai-services
AI_SERVICES_FOLDER = os.path.dirname(APP_FOLDER)


# =====================================================
# MODEL PATH
# =====================================================

MODEL_PATH = os.path.join(
    AI_SERVICES_FOLDER,
    "trained_models",
    "fraud_model.pkl"
)


# =====================================================
# DISPLAY MODEL PATH
# =====================================================

print("Loading fraud detection model...")

print("Model path:")
print(MODEL_PATH)


# =====================================================
# CHECK MODEL
# =====================================================

if not os.path.exists(MODEL_PATH):

    raise FileNotFoundError(
        f"Fraud model not found at: {MODEL_PATH}"
    )


# =====================================================
# LOAD MODEL
# =====================================================

model = joblib.load(
    MODEL_PATH
)

print("Fraud detection model loaded successfully!")


# =====================================================
# PREDICT FRAUD
# =====================================================

def predict_fraud(transaction_data):

    # Convert transaction data into DataFrame
    data = pd.DataFrame(
        [transaction_data]
    )

    # Get fraud probability
    probability = model.predict_proba(
        data
    )[0][1]

    # Determine whether transaction is fraud
    is_fraud = probability >= 0.5

    # Determine risk level
    if probability >= 0.80:

        risk_level = "HIGH"

    elif probability >= 0.40:

        risk_level = "MEDIUM"

    else:

        risk_level = "LOW"


    return {
        "fraud_probability": round(
            float(probability),
            4
        ),

        "is_fraud": bool(
            is_fraud
        ),

        "risk_level": risk_level
    }