import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import api from "../services/api";

import "./MakeTransaction.css";


interface Account {

    id: number;

    account_number: string;

    account_type?: string;

    balance: number;

    currency?: string;

}


interface AIAnalysis {

    fraud_probability: number;

    is_fraud: boolean;

    risk_level: string;

    xgboost_probability?: number;

    transaction_amount_risk?: number;

    amount_risk_level?: string;

    reason?: string;

}


interface TransactionResponse {

    success?: boolean;

    message?: string;

    confirmationRequired?: boolean;

    transactionBlocked?: boolean;

    transaction?: {

        id?: number;

        transaction_type?: string;

        amount?: number;

        description?: string;

        recipient_account?: string | null;

        status?: string;

        fraud_probability?: number;

        risk_level?: string;

    };

    account?: {

        account_number?: string;

        balance?: number;

    };

    ai_analysis?: AIAnalysis;

}


function MakeTransaction() {

    const navigate =
        useNavigate();


    // =================================================
    // ACCOUNT
    // =================================================

    const [
        account,
        setAccount
    ] =
        useState<Account | null>(
            null
        );


    const [
        loading,
        setLoading
    ] =
        useState(true);


    // =================================================
    // FORM
    // =================================================

    const [
        transactionType,
        setTransactionType
    ] =
        useState(
            "withdrawal"
        );


    const [
        amount,
        setAmount
    ] =
        useState("");


    const [
        description,
        setDescription
    ] =
        useState("");


    // =================================================
    // MESSAGES
    // =================================================

    const [
        error,
        setError
    ] =
        useState("");


    const [
        success,
        setSuccess
    ] =
        useState("");


    const [
        submitting,
        setSubmitting
    ] =
        useState(false);


    // =================================================
    // AI
    // =================================================

    const [
        aiAnalysis,
        setAIAnalysis
    ] =
        useState<AIAnalysis>({

            fraud_probability:
                0,

            is_fraud:
                false,

            risk_level:
                "LOW",

            xgboost_probability:
                0,

            transaction_amount_risk:
                0,

            amount_risk_level:
                "LOW",

            reason:
                "AI analysis will appear after transaction processing."

        });


    // =================================================
    // CONFIRMATION POPUP
    // =================================================

    const [
        confirmationOpen,
        setConfirmationOpen
    ] =
        useState(false);


    const [
        pendingTransactionId,
        setPendingTransactionId
    ] =
        useState<number | null>(
            null
        );


    const [
        pendingTransactionAmount,
        setPendingTransactionAmount
    ] =
        useState(0);


    const [
        confirmationLoading,
        setConfirmationLoading
    ] =
        useState(false);


    // =================================================
    // LOAD ACCOUNT
    // =================================================

    const loadAccount =
        async () => {

            try {

                setLoading(true);


                const response =
                    await api.get(
                        "/accounts"
                    );


                console.log(
                    "Account response:",
                    response.data
                );


                if (
                    response.data?.success
                ) {

                    if (
                        response.data.account
                    ) {

                        setAccount(
                            response.data.account
                        );

                    } else if (
                        response.data.accounts &&
                        response.data.accounts.length >
                        0
                    ) {

                        setAccount(
                            response.data.accounts[0]
                        );

                    }

                }


            } catch (error: any) {

                console.error(
                    "Account loading error:",
                    error
                );


                setError(
                    error?.response?.data?.message ||
                    "Unable to load account information."
                );


            } finally {

                setLoading(false);

            }

        };


    // =================================================
    // LOAD ACCOUNT ON PAGE LOAD
    // =================================================

    useEffect(() => {

        loadAccount();

    }, []);


    // =================================================
    // FORMAT MONEY
    // =================================================

    const formatMoney =
        (
            value: number
        ) => {

            return Number(
                value || 0
            ).toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits:
                        2,

                    maximumFractionDigits:
                        2
                }
            );

        };


    // =================================================
    // RISK HELPERS
    // =================================================

    const riskLevel =
        (
            aiAnalysis.risk_level ||
            "LOW"
        ).toUpperCase();


    const riskProbability =
        Math.min(
            Math.max(
                Number(
                    aiAnalysis.fraud_probability ||
                    0
                ),
                0
            ),
            1
        );


    const riskPercentage =
        riskProbability *
        100;


    const riskClass =
        riskLevel === "HIGH"
            ? "risk-high"
            : riskLevel === "MEDIUM"
                ? "risk-medium"
                : "risk-low";


    // =================================================
    // SUBMIT TRANSACTION
    // =================================================

    const handleSubmit =
        async (
            event:
                React.FormEvent
        ) => {

            event.preventDefault();


            setError("");

            setSuccess("");


            const numericAmount =
                Number(amount);


            // =========================================
            // VALIDATE AMOUNT
            // =========================================

            if (
                !Number.isFinite(
                    numericAmount
                ) ||
                numericAmount <= 0
            ) {

                setError(
                    "Please enter a valid transaction amount."
                );

                return;

            }


            // =========================================
            // VALIDATE BALANCE
            // =========================================

            const currentBalance =
                Number(
                    account?.balance ||
                    0
                );


            if (
                (
                    transactionType ===
                    "withdrawal" ||

                    transactionType ===
                    "transfer"
                ) &&
                numericAmount >
                currentBalance
            ) {

                setError(
                    `Insufficient balance. Your available balance is ₹${formatMoney(
                        currentBalance
                    )}.`
                );

                return;

            }


            try {

                setSubmitting(true);


                const response =
                    await api.post(
                        "/transactions",
                        {

                            transaction_type:
                                transactionType,

                            amount:
                                numericAmount,

                            description:
                                description

                        }
                    );


                const data:
                    TransactionResponse =
                    response.data;


                console.log(
                    "Transaction response:",
                    data
                );


                // =====================================
                // UPDATE AI ANALYSIS
                // =====================================

                if (
                    data.ai_analysis
                ) {

                    setAIAnalysis(
                        data.ai_analysis
                    );

                }


                // =====================================
                // HIGH RISK
                // =====================================

                if (
                    data.transactionBlocked ===
                    true
                ) {

                    setError(
                        "Your transaction was blocked due to unusual activity."
                    );


                    setSuccess("");


                    return;

                }


                // =====================================
                // MEDIUM RISK
                // =====================================

                if (
                    data.confirmationRequired ===
                    true
                ) {

                    const transactionId =
                        data.transaction?.id;


                    if (
                        transactionId
                    ) {

                        setPendingTransactionId(
                            transactionId
                        );


                        setPendingTransactionAmount(
                            numericAmount
                        );


                        setConfirmationOpen(
                            true
                        );

                    }


                    return;

                }


                // =====================================
                // LOW RISK
                // =====================================

                if (
                    data.success !==
                    false
                ) {

                    if (
                        data.account?.balance !==
                        undefined
                    ) {

                        setAccount(
                            previous => ({

                                ...(previous ||
                                    {}),

                                balance:
                                    Number(
                                        data.account!
                                            .balance
                                    )

                            })
                        );

                    } else {

                        await loadAccount();

                    }


                    setSuccess(
                        data.message ||
                        "Transaction completed successfully."
                    );


                    setError("");


                    setAmount("");

                    setDescription("");

                }


            } catch (
                error: any
            ) {

                console.error(
                    "Transaction error:",
                    error
                );


                setError(
                    error?.response?.data?.message ||
                    "Transaction failed. Please try again."
                );


                setSuccess("");


                if (
                    error?.response?.data?.ai_analysis
                ) {

                    setAIAnalysis(
                        error.response.data.ai_analysis
                    );

                }

            } finally {

                setSubmitting(false);

            }

        };


    // =================================================
    // ALLOW TRANSACTION
    // =================================================

    const handleAllowTransaction =
        async () => {

            if (
                !pendingTransactionId
            ) {

                return;

            }


            try {

                setConfirmationLoading(
                    true
                );


                setError("");


                const response =
                    await api.post(
                        `/transactions/${pendingTransactionId}/confirm`
                    );


                const data =
                    response.data;


                if (
                    data.success
                ) {

                    setConfirmationOpen(
                        false
                    );


                    setSuccess(
                        "Transaction approved successfully. Your transaction has been completed."
                    );


                    setError("");


                    if (
                        data.account?.balance !==
                        undefined
                    ) {

                        setAccount(
                            previous => ({

                                ...(previous ||
                                    {}),

                                balance:
                                    Number(
                                        data.account
                                            .balance
                                    )

                            })
                        );

                    } else {

                        await loadAccount();

                    }


                    setAmount("");

                    setDescription("");


                    if (
                        data.transaction
                    ) {

                        setAIAnalysis({

                            fraud_probability:
                                Number(
                                    data.transaction
                                        .fraud_probability ||
                                    0
                                ),

                            is_fraud:
                                false,

                            risk_level:
                                "LOW",

                            xgboost_probability:
                                0,

                            transaction_amount_risk:
                                Number(
                                    data.transaction
                                        .fraud_probability ||
                                    0
                                ),

                            amount_risk_level:
                                "MEDIUM",

                            reason:
                                "You confirmed this transaction."

                        });

                    }

                }


            } catch (
                error: any
            ) {

                console.error(
                    "Allow transaction error:",
                    error
                );


                setError(
                    error?.response?.data?.message ||
                    "Unable to approve transaction."
                );

            } finally {

                setConfirmationLoading(
                    false
                );

                setPendingTransactionId(
                    null
                );

            }

        };


    // =================================================
    // BLOCK TRANSACTION
    // =================================================

    const handleBlockTransaction =
        async () => {

            if (
                !pendingTransactionId
            ) {

                return;

            }


            try {

                setConfirmationLoading(
                    true
                );


                setError("");


                await api.post(
                    `/transactions/${pendingTransactionId}/block`
                );


                setConfirmationOpen(
                    false
                );


                setSuccess("");


                setError(
                    "Your transaction was blocked due to unusual activity."
                );


                setAmount("");

                setDescription("");


            } catch (
                error: any
            ) {

                console.error(
                    "Block transaction error:",
                    error
                );


                setError(
                    error?.response?.data?.message ||
                    "Unable to block transaction."
                );

            } finally {

                setConfirmationLoading(
                    false
                );

                setPendingTransactionId(
                    null
                );

            }

        };


    // =================================================
    // LOADING
    // =================================================

    if (
        loading
    ) {

        return (

            <div className="make-transaction-loading">

                <div>

                    <h2>
                        Loading Transaction Page...
                    </h2>

                    <p>
                        Please wait while we load your account.
                    </p>

                </div>

            </div>

        );

    }


    // =================================================
    // MAIN UI
    // =================================================

    return (

        <div className="make-transaction-page">

            {/* =========================================
                PAGE HEADER
            ========================================= */}

            <div className="make-transaction-header">

                <div>

                    <h1>
                        Make Transaction
                    </h1>

                    <p>
                        Create a new banking transaction securely with AI fraud protection.
                    </p>

                </div>


                <button
                    type="button"
                    className="back-dashboard-button"
                    onClick={() =>
                        navigate(
                            "/dashboard"
                        )
                    }
                >
                    ← Dashboard
                </button>

            </div>


            {/* =========================================
                CONTENT
            ========================================= */}

            <div className="make-transaction-content">


                {/* =====================================
                    FORM CARD
                ===================================== */}

                <div className="transaction-form-card">

                    <div className="transaction-form-icon">
                        ₹
                    </div>


                    <h2>
                        Transaction Details
                    </h2>


                    <p className="transaction-form-description">
                        Choose the transaction type and enter the required details.
                    </p>


                    {/* BALANCE */}

                    <div className="available-balance">

                        <div>

                            <span>
                                Available Balance
                            </span>

                            <strong>
                                ₹
                                {formatMoney(
                                    Number(
                                        account?.balance ||
                                        0
                                    )
                                )}
                            </strong>

                        </div>


                        <div className="balance-mini-icon">
                            ₹
                        </div>

                    </div>


                    {/* TRANSACTION TYPE */}

                    <div className="form-group">

                        <label>
                            Transaction Type
                        </label>


                        <select
                            value={
                                transactionType
                            }
                            onChange={
                                event =>
                                    setTransactionType(
                                        event.target.value
                                    )
                            }
                        >

                            <option value="deposit">
                                Deposit
                            </option>

                            <option value="withdrawal">
                                Withdrawal
                            </option>

                            <option value="transfer">
                                Transfer
                            </option>

                        </select>

                    </div>


                    {/* AMOUNT */}

                    <div className="form-group">

                        <label>
                            Amount
                        </label>


                        <div className="amount-input-wrapper">

                            <span>
                                ₹
                            </span>


                            <input
                                type="number"
                                min="1"
                                step="0.01"
                                value={
                                    amount
                                }
                                onChange={
                                    event =>
                                        setAmount(
                                            event.target.value
                                        )
                                }
                                placeholder="Enter amount"
                            />

                        </div>

                    </div>


                    {/* DESCRIPTION */}

                    <div className="form-group">

                        <label>
                            Description
                        </label>


                        <textarea
                            value={
                                description
                            }
                            onChange={
                                event =>
                                    setDescription(
                                        event.target.value
                                    )
                            }
                            placeholder="Enter transaction description"
                        />

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="transaction-message error">

                            <span>
                                !
                            </span>

                            <div>

                                <strong>
                                    Transaction Alert
                                </strong>

                                <p>
                                    {error}
                                </p>

                            </div>

                        </div>

                    )}


                    {/* SUCCESS */}

                    {success && (

                        <div className="transaction-message success">

                            <span>
                                ✓
                            </span>

                            <div>

                                <strong>
                                    Transaction Successful
                                </strong>

                                <p>
                                    {success}
                                </p>

                            </div>

                        </div>

                    )}


                    {/* SUBMIT */}

                    <button
                        type="button"
                        className="make-transaction-button"
                        onClick={
                            handleSubmit
                        }
                        disabled={
                            submitting
                        }
                    >

                        {submitting
                            ? "Analyzing Transaction..."
                            : "Continue Transaction"}

                    </button>

                </div>


                {/* =====================================
                    AI SECURITY CARD
                ===================================== */}

                <div className="ai-protection-card">

                    <div className="ai-card-icon">
                        🤖
                    </div>


                    <div className="ai-card-label">
                        AI SECURITY
                    </div>


                    <h2>
                        AI Fraud Protection
                    </h2>


                    <p className="ai-card-description">
                        Every transaction is analyzed by our XGBoost fraud detection model before it is completed.
                    </p>


                    {/* RISK GRID */}

                    <div className="ai-risk-grid">

                        <div className="ai-risk-item">

                            <span>
                                Risk Level
                            </span>

                            <strong
                                className={
                                    riskClass
                                }
                            >
                                {riskLevel}
                            </strong>

                        </div>


                        <div className="ai-risk-item">

                            <span>
                                Fraud Probability
                            </span>

                            <strong>
                                {riskPercentage.toFixed(
                                    2
                                )}
                                %
                            </strong>

                        </div>


                        <div className="ai-risk-item">

                            <span>
                                XGBoost Model Score
                            </span>

                            <strong>
                                {(
                                    Number(
                                        aiAnalysis.xgboost_probability ||
                                        0
                                    ) *
                                    100
                                ).toFixed(
                                    2
                                )}
                                %
                            </strong>

                        </div>


                        <div className="ai-risk-item">

                            <span>
                                Transaction Amount Risk
                            </span>

                            <strong
                                className={
                                    riskClass
                                }
                            >
                                {(
                                    Number(
                                        aiAnalysis.transaction_amount_risk ||
                                        0
                                    ) *
                                    100
                                ).toFixed(
                                    2
                                )}
                                %
                            </strong>

                        </div>

                    </div>


                    {/* PROGRESS */}

                    <div className="ai-progress-section">

                        <div className="ai-progress-header">

                            <span>
                                Overall Risk Assessment
                            </span>

                            <strong>
                                {riskPercentage.toFixed(
                                    2
                                )}
                                %
                            </strong>

                        </div>


                        <div className="ai-progress-bar">

                            <div
                                className={`ai-progress-fill ${riskClass}`}
                                style={{
                                    width:
                                        `${Math.max(
                                            riskPercentage,
                                            1
                                        )}%`
                                }}
                            />

                        </div>

                    </div>


                    {/* AI DECISION */}

                    <div
                        className={`ai-decision ${riskClass}`}
                    >

                        <div className="ai-decision-icon">

                            {riskLevel ===
                            "HIGH"
                                ? "!"
                                : riskLevel ===
                                  "MEDIUM"
                                    ? "!"
                                    : "✓"}

                        </div>


                        <div>

                            <strong>

                                {riskLevel ===
                                "HIGH"
                                    ? "Transaction Blocked"
                                    : riskLevel ===
                                      "MEDIUM"
                                        ? "Confirmation Required"
                                        : "Transaction Can Proceed"}

                            </strong>


                            <p>

                                {riskLevel ===
                                "HIGH"
                                    ? "This transaction has been blocked because unusual activity was detected."
                                    : riskLevel ===
                                      "MEDIUM"
                                        ? "Please confirm that you initiated this transaction."
                                        : "Transaction can proceed normally."}

                            </p>

                        </div>

                    </div>


                    {/* REASON */}

                    <div className="ai-reason">

                        <strong>
                            AI Analysis Reason
                        </strong>

                        <p>
                            {
                                aiAnalysis.reason ||
                                "No additional risk information."
                            }
                        </p>

                    </div>


                    {/* HOW AI WORKS */}

                    <div className="ai-analysis-info">

                        <strong>
                            How AI Protects You
                        </strong>


                        <div className="ai-analysis-step">

                            <span>
                                01
                            </span>

                            <p>
                                The transaction amount is analyzed by the fraud detection system.
                            </p>

                        </div>


                        <div className="ai-analysis-step">

                            <span>
                                02
                            </span>

                            <p>
                                XGBoost evaluates transaction characteristics and produces a fraud probability.
                            </p>

                        </div>


                        <div className="ai-analysis-step">

                            <span>
                                03
                            </span>

                            <p>
                                Higher-risk transactions require confirmation or are blocked automatically.
                            </p>

                        </div>

                    </div>


                    {/* STATUS */}

                    <div className="ai-protection-status">

                        <div className="ai-status-dot" />

                        <div>

                            <strong>
                                AI Protection Active
                            </strong>

                            <small>
                                Real-time transaction analysis enabled
                            </small>

                        </div>

                    </div>

                </div>

            </div>


            {/* =========================================
                FRAUD CONFIRMATION POPUP
            ========================================= */}

            {confirmationOpen && (

                <div className="fraud-confirmation-overlay">

                    <div className="fraud-confirmation-modal">

                        <div className="fraud-warning-icon">
                            !
                        </div>


                        <div className="fraud-confirmation-content">

                            <div className="fraud-confirmation-label">
                                SECURITY ALERT
                            </div>


                            <h2>
                                Unusual Transaction Detected
                            </h2>


                            <p className="fraud-confirmation-message">

                                A transaction of{" "}

                                <strong>
                                    ₹
                                    {formatMoney(
                                        pendingTransactionAmount
                                    )}
                                </strong>

                                {" "}has been detected.

                            </p>


                            <p className="fraud-confirmation-question">

                                Our AI security system has identified
                                this transaction as unusual.

                                <br />

                                <strong>
                                    Are you making this transaction?
                                </strong>

                            </p>


                            <div className="fraud-confirmation-risk">

                                <div>

                                    <span>
                                        AI Risk Score
                                    </span>

                                    <strong>
                                        {(
                                            riskPercentage
                                        ).toFixed(
                                            2
                                        )}
                                        %
                                    </strong>

                                </div>


                                <div>

                                    <span>
                                        Risk Level
                                    </span>

                                    <strong>
                                        MEDIUM
                                    </strong>

                                </div>

                            </div>


                            <div className="fraud-confirmation-actions">

                                <button
                                    type="button"
                                    className="fraud-block-button"
                                    onClick={
                                        handleBlockTransaction
                                    }
                                    disabled={
                                        confirmationLoading
                                    }
                                >

                                    {confirmationLoading
                                        ? "Processing..."
                                        : "Block Transaction"}

                                </button>


                                <button
                                    type="button"
                                    className="fraud-allow-button"
                                    onClick={
                                        handleAllowTransaction
                                    }
                                    disabled={
                                        confirmationLoading
                                    }
                                >

                                    {confirmationLoading
                                        ? "Processing..."
                                        : "Allow Transaction"}

                                </button>

                            </div>


                            <p className="fraud-confirmation-note">

                                If you did not initiate this transaction,
                                choose{" "}

                                <strong>
                                    Block Transaction
                                </strong>

                                {" "}immediately.

                            </p>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}


export default MakeTransaction;