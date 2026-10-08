import { useEffect, useState } from "react";
import api from "../services/api";
import "./Transactions.css";

interface Transaction {
    id: number;
    transaction_type: string;
    amount: number;
    recipient_account: string | null;
    description: string | null;
    status: string;
    fraud_score: number | null;
    fraud_probability: number | null;
    risk_level: string | null;
    created_at: string;
}

interface TransactionResponse {
    success: boolean;
    account_number?: string;
    balance?: number;
    transactions?: Transaction[];
    message?: string;
}

function Transactions() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accountNumber, setAccountNumber] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    // =====================================================
    // LOAD TRANSACTIONS
    // =====================================================

    const loadTransactions = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response =
                await api.get<TransactionResponse>(
                    "/transactions"
                );

            if (response.data.success) {
                setAccountNumber(
                    response.data.account_number || ""
                );

                /*
                 * IMPORTANT:
                 * Do not sort or reverse here.
                 * The backend order is preserved exactly.
                 */
                setTransactions(
                    response.data.transactions || []
                );
            } else {
                setError(
                    response.data.message ||
                    "Unable to load transactions."
                );
            }
        } catch (err: any) {
            console.error(
                "Transactions error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load your transactions."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        loadTransactions();
    }, []);

    // =====================================================
    // FORMAT AMOUNT
    // =====================================================

    const formatAmount = (amount: number) => {
        return Number(amount || 0).toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    };

    // =====================================================
    // FORMAT DATE AND TIME
    // =====================================================

    const formatDateTime = (dateString: string) => {
        if (!dateString) {
            return {
                date: "-",
                time: "-"
            };
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return {
                date: "-",
                time: "-"
            };
        }

        return {
            date: date.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            ),
            time: date.toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )
        };
    };

    // =====================================================
    // TITLE
    // =====================================================

    const getTitle = (transaction: Transaction) => {
        if (
            transaction.description &&
            transaction.description.trim()
        ) {
            return transaction.description;
        }

        switch (
            transaction.transaction_type?.toLowerCase()
        ) {
            case "deposit":
                return "Deposit";

            case "withdrawal":
                return "Withdrawal";

            case "transfer":
                return "Money Transfer";

            default:
                return "Transaction";
        }
    };

    // =====================================================
    // TYPE
    // =====================================================

    const getType = (type: string) => {
        switch (type?.toLowerCase()) {
            case "deposit":
                return "Deposit";

            case "withdrawal":
                return "Withdrawal";

            case "transfer":
                return "Transfer";

            default:
                return "Transaction";
        }
    };

    // =====================================================
    // STATUS
    // =====================================================

    const getStatus = (status: string) => {
        const value = status?.toLowerCase();

        if (value === "blocked") {
            return "BLOCKED";
        }

        if (value === "pending") {
            return "PENDING";
        }

        return "COMPLETED";
    };

    // =====================================================
    // STATUS CLASS
    // =====================================================

    const getStatusClass = (status: string) => {
        const value = status?.toLowerCase();

        if (value === "blocked") {
            return "blocked";
        }

        if (value === "pending") {
            return "pending";
        }

        return "completed";
    };

    // =====================================================
    // ICON
    // =====================================================

    const getIcon = (transaction: Transaction) => {
        if (
            transaction.status?.toLowerCase() ===
            "blocked"
        ) {
            return "!";
        }

        switch (
            transaction.transaction_type?.toLowerCase()
        ) {
            case "deposit":
                return "↓";

            case "withdrawal":
                return "↑";

            case "transfer":
                return "⇄";

            default:
                return "₹";
        }
    };

    // =====================================================
    // ICON CLASS
    // =====================================================

    const getIconClass = (transaction: Transaction) => {
        if (
            transaction.status?.toLowerCase() ===
            "blocked"
        ) {
            return "blocked";
        }

        switch (
            transaction.transaction_type?.toLowerCase()
        ) {
            case "deposit":
                return "deposit";

            case "withdrawal":
                return "withdrawal";

            case "transfer":
                return "transfer";

            default:
                return "deposit";
        }
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="transactions-page">
                <div className="transactions-loading">
                    <div className="transactions-loading-spinner">
                        ↻
                    </div>

                    <h2>
                        Loading Transactions
                    </h2>

                    <p>
                        Please wait while we load
                        your transaction history.
                    </p>
                </div>
            </div>
        );
    }

    // =====================================================
    // ERROR
    // =====================================================

    if (error) {
        return (
            <div className="transactions-page">
                <div className="transactions-error">
                    <div className="transactions-error-icon">
                        !
                    </div>

                    <h2>
                        Unable to Load Transactions
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            loadTransactions()
                        }
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // =====================================================
    // MAIN
    // =====================================================

    return (
        <div className="transactions-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="transactions-page-header">

                <div>
                    <div className="transactions-eyebrow">
                        OVERVIEW
                    </div>

                    <h1>
                        Transactions
                    </h1>

                    <p>
                        View and manage your recent
                        banking transactions
                    </p>
                </div>

                <button
                    type="button"
                    className="transactions-refresh-button"
                    onClick={() =>
                        loadTransactions(true)
                    }
                    disabled={refreshing}
                >
                    {refreshing
                        ? "Refreshing..."
                        : "↻ Refresh"}
                </button>

            </div>


            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

            <div className="transactions-summary">

                <div className="transactions-summary-card">

                    <div className="transactions-summary-icon">
                        #
                    </div>

                    <div className="transactions-summary-content">

                        <span>
                            ACCOUNT NUMBER
                        </span>

                        <strong>
                            {accountNumber || "N/A"}
                        </strong>

                    </div>

                </div>


                <div className="transactions-summary-card">

                    <div className="transactions-summary-icon">
                        ⇄
                    </div>

                    <div className="transactions-summary-content">

                        <span>
                            TOTAL TRANSACTIONS
                        </span>

                        <strong>
                            {transactions.length}
                        </strong>

                    </div>

                </div>

            </div>


            {/* =================================================
                HISTORY CARD
            ================================================= */}

            <div className="transactions-history-card">

                <div className="transactions-history-header">

                    <div>
                        <h2>
                            Transaction History
                        </h2>

                        <p>
                            Your latest deposits,
                            withdrawals and transfers
                        </p>
                    </div>

                    <div className="transactions-count">
                        {transactions.length} transactions
                    </div>

                </div>


                {/* =================================================
                    EMPTY
                ================================================= */}

                {transactions.length === 0 ? (

                    <div className="transactions-empty">

                        <div className="transactions-empty-icon">
                            ⇄
                        </div>

                        <h3>
                            No Transactions Yet
                        </h3>

                        <p>
                            Your banking transactions
                            will appear here.
                        </p>

                    </div>

                ) : (

                    /* =================================================
                       TABLE
                    ================================================= */

                    <div className="transactions-table-container">

                        <table className="transactions-table">

                            <thead>
                                <tr>

                                    <th>
                                        TRANSACTION
                                    </th>

                                    <th>
                                        TYPE
                                    </th>

                                    <th>
                                        AMOUNT
                                    </th>

                                    <th>
                                        DATE & TIME
                                    </th>

                                    <th>
                                        STATUS
                                    </th>

                                </tr>
                            </thead>


                            <tbody>

                                {/*
                                 * DO NOT SORT.
                                 * DO NOT REVERSE.
                                 *
                                 * Backend order is preserved.
                                 */}

                                {transactions.map(
                                    (transaction) => {

                                        const blocked =
                                            transaction.status
                                                ?.toLowerCase() ===
                                            "blocked";

                                        const date =
                                            formatDateTime(
                                                transaction.created_at
                                            );

                                        return (
                                            <tr
                                                key={
                                                    transaction.id
                                                }
                                                className={
                                                    blocked
                                                        ? "blocked-row"
                                                        : ""
                                                }
                                            >

                                                {/* =========================
                                                    TRANSACTION
                                                ========================== */}

                                                <td>

                                                    <div className="transaction-cell">

                                                        <div
                                                            className={`transaction-icon ${getIconClass(
                                                                transaction
                                                            )}`}
                                                        >
                                                            {getIcon(
                                                                transaction
                                                            )}
                                                        </div>


                                                        <div className="transaction-info">

                                                            <strong>
                                                                {getTitle(
                                                                    transaction
                                                                )}
                                                            </strong>

                                                            <span className="transaction-number">
                                                                Transaction #
                                                                {
                                                                    transaction.id
                                                                }
                                                            </span>

                                                            {blocked && (
                                                                <span className="transaction-blocked-text">
                                                                    Blocked by AI fraud detection
                                                                </span>
                                                            )}

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* =========================
                                                    TYPE
                                                ========================== */}

                                                <td>

                                                    <span className="transaction-type">
                                                        {getType(
                                                            transaction.transaction_type
                                                        )}
                                                    </span>

                                                </td>


                                                {/* =========================
                                                    AMOUNT
                                                ========================== */}

                                                <td>

                                                    <strong
                                                        className={
                                                            `transaction-amount ${
                                                                blocked
                                                                    ? "blocked-amount"
                                                                    : transaction.transaction_type
                                                                        ?.toLowerCase() ===
                                                                        "deposit"
                                                                        ? "amount-positive"
                                                                        : "amount-negative"
                                                            }`
                                                        }
                                                    >

                                                        {transaction.transaction_type
                                                            ?.toLowerCase() ===
                                                            "deposit"
                                                            ? "+"
                                                            : "-"}

                                                        ₹
                                                        {formatAmount(
                                                            transaction.amount
                                                        )}

                                                    </strong>

                                                </td>


                                                {/* =========================
                                                    DATE & TIME
                                                ========================== */}

                                                <td>

                                                    <div className="transaction-date">

                                                        <strong>
                                                            {date.date}
                                                        </strong>

                                                        <span>
                                                            {date.time}
                                                        </span>

                                                    </div>

                                                </td>


                                                {/* =========================
                                                    STATUS
                                                ========================== */}

                                                <td>

                                                    <span
                                                        className={`status-badge ${getStatusClass(
                                                            transaction.status
                                                        )}`}
                                                    >
                                                        {getStatus(
                                                            transaction.status
                                                        )}
                                                    </span>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>


            {/* =================================================
                AI NOTICE
            ================================================= */}

            {transactions.some(
                transaction =>
                    transaction.status
                        ?.toLowerCase() ===
                    "blocked"
            ) && (

                <div className="transactions-ai-notice">

                    <div className="transactions-ai-icon">
                        ✓
                    </div>

                    <div>

                        <strong>
                            AI Fraud Protection
                        </strong>

                        <p>
                            Transactions marked as
                            <b> BLOCKED </b>
                            were stopped by the AI
                            fraud detection system
                            because unusual activity
                            was detected.
                        </p>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Transactions;