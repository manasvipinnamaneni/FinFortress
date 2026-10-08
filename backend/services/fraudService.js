const AI_SERVICE_URL =
    process.env.AI_SERVICE_URL || "http://localhost:8000";


// =====================================================
// ANALYZE TRANSACTION
// =====================================================

const analyzeTransaction = async (amount) => {

    try {

        const numericAmount = Number(amount);


        // =================================================
        // VALIDATE AMOUNT
        // =================================================

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {

            throw new Error(
                "Invalid transaction amount"
            );

        }


        // =================================================
        // PREPARE DATA FOR XGBOOST
        // =================================================

        const payload = {

            Time: Math.floor(
                Date.now() / 1000
            ),

            Amount: numericAmount

        };


        // The original credit-card fraud model
        // expects V1 to V28 features.

        for (let i = 1; i <= 28; i++) {

            payload[`V${i}`] = 0;

        }


        // =================================================
        // XGBOOST AI ANALYSIS
        // =================================================

        let xgboostProbability = 0;

        let xgboostIsFraud = false;

        let xgboostRisk = "LOW";


        try {

            console.log(
                "Sending transaction to XGBoost AI service..."
            );

            console.log(
                "Amount:",
                numericAmount
            );


            const response = await fetch(
                `${AI_SERVICE_URL}/predict`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(
                        payload
                    )
                }
            );


            if (response.ok) {

                const data =
                    await response.json();


                console.log(
                    "XGBoost AI response:",
                    data
                );


                const prediction =
                    data.prediction || data;


                xgboostProbability =
                    Number(
                        prediction.fraud_probability ||
                        prediction.probability ||
                        0
                    );


                xgboostIsFraud =
                    Boolean(
                        prediction.is_fraud ||
                        false
                    );


                xgboostRisk =
                    prediction.risk_level ||
                    "LOW";

            } else {

                console.error(
                    "XGBoost service returned:",
                    response.status
                );

            }

        } catch (aiError) {

            console.error(
                "XGBoost service error:",
                aiError.message
            );

        }


        // =================================================
        // PROGRESSIVE TRANSACTION AMOUNT RISK
        // =================================================
        //
        // IMPORTANT:
        // There are NO abrupt jumps such as:
        //
        // ₹99,999  -> 0.05
        // ₹100,000 -> 0.20
        //
        // Instead, the risk increases gradually.
        //


        let amountRisk = 0;

        let amountRiskLevel = "LOW";

        let amountRiskReason =
            "Transaction amount is within the normal range.";


        // =================================================
        // ₹0 - ₹1,00,000
        // Risk: 0.05 -> 0.10
        // =================================================

        if (numericAmount <= 100000) {

            amountRisk =
                0.05 +
                (
                    numericAmount / 100000
                ) * 0.05;


            amountRiskLevel = "LOW";


            amountRiskReason =
                "Transaction amount is within the normal range.";

        }


        // =================================================
        // ₹1,00,000 - ₹5,00,000
        // Risk: 0.10 -> 0.30
        // =================================================

        else if (numericAmount <= 500000) {

            amountRisk =
                0.10 +
                (
                    (numericAmount - 100000) /
                    400000
                ) * 0.20;


            amountRiskLevel = "LOW";


            amountRiskReason =
                "Higher-value transaction detected.";

        }


        // =================================================
        // ₹5,00,000 - ₹10,00,000
        // Risk: 0.30 -> 0.45
        // =================================================

        else if (numericAmount <= 1000000) {

            amountRisk =
                0.30 +
                (
                    (numericAmount - 500000) /
                    500000
                ) * 0.15;


            amountRiskLevel = "MEDIUM";


            amountRiskReason =
                "Large-value transaction detected.";

        }


        // =================================================
        // ₹10,00,000 - ₹25,00,000
        // Risk: 0.45 -> 0.60
        // =================================================

        else if (numericAmount <= 2500000) {

            amountRisk =
                0.45 +
                (
                    (numericAmount - 1000000) /
                    1500000
                ) * 0.15;


            amountRiskLevel = "MEDIUM";


            amountRiskReason =
                "High-value transaction requires additional monitoring.";

        }


        // =================================================
        // ₹25,00,000 - ₹50,00,000
        // Risk: 0.60 -> 0.75
        // =================================================

        else if (numericAmount <= 5000000) {

            amountRisk =
                0.60 +
                (
                    (numericAmount - 2500000) /
                    2500000
                ) * 0.15;


            amountRiskLevel = "MEDIUM";


            amountRiskReason =
                "Very high-value transaction requires additional monitoring.";

        }


        // =================================================
        // ₹50,00,000 - ₹1,00,00,000
        // Risk: 0.75 -> 0.95
        // =================================================

        else if (numericAmount < 10000000) {

            amountRisk =
                0.75 +
                (
                    (numericAmount - 5000000) /
                    5000000
                ) * 0.20;


            amountRiskLevel = "HIGH";


            amountRiskReason =
                "Extremely high-value transaction detected.";

        }


        // =================================================
        // ₹1 CRORE AND ABOVE
        // Risk: 0.95
        // =================================================

        else {

            amountRisk = 0.95;

            amountRiskLevel = "HIGH";


            amountRiskReason =
                "Extremely high-value transaction detected. Additional verification is recommended.";

        }


        // =================================================
        // LIMIT AMOUNT RISK
        // =================================================

        amountRisk =
            Math.min(
                Math.max(
                    amountRisk,
                    0.05
                ),
                0.95
            );


        // =================================================
        // DEBUG INFORMATION
        // =================================================

        console.log(
            "----------------------------------------"
        );

        console.log(
            "TRANSACTION AMOUNT:",
            numericAmount
        );

        console.log(
            "XGBOOST PROBABILITY:",
            xgboostProbability
        );

        console.log(
            "AMOUNT RISK:",
            amountRisk
        );

        console.log(
            "AMOUNT RISK LEVEL:",
            amountRiskLevel
        );

        console.log(
            "----------------------------------------"
        );


        // =================================================
        // FINAL FRAUD PROBABILITY
        // =================================================
        //
        // We combine:
        //
        // 1. XGBoost ML prediction
        // 2. Progressive banking transaction risk
        //
        // The higher risk is used as the final score.
        // =================================================

        const finalProbability =
            Math.max(
                xgboostProbability,
                amountRisk
            );


        // =================================================
        // FINAL RISK LEVEL
        // =================================================

        let finalRiskLevel = "LOW";


        if (
            finalProbability >= 0.80 ||
            xgboostIsFraud === true
        ) {

            finalRiskLevel = "HIGH";

        }

        else if (
            finalProbability >= 0.50
        ) {

            finalRiskLevel = "MEDIUM";

        }

        else {

            finalRiskLevel = "LOW";

        }


        // =================================================
        // FINAL FRAUD DECISION
        // =================================================

        const finalIsFraud =
            finalRiskLevel === "HIGH";


        // =================================================
        // FINAL RESULT
        // =================================================

        const result = {

            success: true,

            prediction: {

                fraud_probability:
                    Number(
                        finalProbability.toFixed(4)
                    ),


                is_fraud:
                    finalIsFraud,


                risk_level:
                    finalRiskLevel,


                // XGBoost result
                xgboost_probability:
                    Number(
                        xgboostProbability.toFixed(4)
                    ),


                xgboost_risk_level:
                    xgboostRisk,


                xgboost_is_fraud:
                    xgboostIsFraud,


                // Transaction amount result
                transaction_amount_risk:
                    Number(
                        amountRisk.toFixed(4)
                    ),


                amount_risk_level:
                    amountRiskLevel,


                reason:
                    amountRiskReason

            }

        };


        // =================================================
        // LOG FINAL RESULT
        // =================================================

        console.log(
            "Final AI fraud analysis:",
            result
        );


        return result;


    } catch (error) {

        // =================================================
        // ERROR HANDLING
        // =================================================

        console.error(
            "Fraud analysis error:",
            error
        );


        return {

            success: false,

            prediction: {

                fraud_probability: 0,

                is_fraud: false,

                risk_level:
                    "AI_UNAVAILABLE",

                xgboost_probability: 0,

                transaction_amount_risk: 0,

                amount_risk_level:
                    "UNKNOWN",

                reason:
                    "AI fraud analysis could not be completed."

            },

            error:
                error.message

        };

    }

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    analyzeTransaction

};