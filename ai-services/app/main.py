from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.schemas.fraud_schema import FraudRequest
from app.services.fraud_service import predict_fraud


# =====================================================
# CREATE FASTAPI APP
# =====================================================

app = FastAPI(
    title="AI Smart Banking Fraud Detection",
    description="AI service for detecting potentially fraudulent banking transactions",
    version="1.0.0"
)


# =====================================================
# CORS
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =====================================================
# HOME
# =====================================================

@app.get("/")
def home():

    return {
        "success": True,
        "message": "AI Fraud Detection Service is running"
    }


# =====================================================
# HEALTH CHECK
# =====================================================

@app.get("/health")
def health():

    return {
        "success": True,
        "service": "fraud-detection",
        "status": "healthy"
    }


# =====================================================
# FRAUD PREDICTION
# =====================================================

@app.post("/predict")
def predict(request: FraudRequest):

    transaction_data = request.model_dump()

    result = predict_fraud(
        transaction_data
    )

    return {
        "success": True,
        "prediction": result
    }