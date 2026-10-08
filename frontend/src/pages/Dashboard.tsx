import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import api from "../services/api";

import "./Dashboard.css";


interface Account {
    id: number;
    account_number: string;
    account_type: string;
    balance: number;
}


interface Transaction {
    id: number;
    transaction_type: string;
    amount: number;
    recipient_account: string | null;
    description: string;
    status: string;
    fraud_probability?: number;
    created_at: string;
}


interface User {
    id: number;
    full_name: string;
    email: string;
    phone: string;
    role: string;
}


function Dashboard() {

    const navigate = useNavigate();


    const [user, setUser] =
        useState<User | null>(null);

    const [account, setAccount] =
        useState<Account | null>(null);

    const [transactions, setTransactions] =
        useState<Transaction[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    useEffect(() => {

        loadDashboard();

    }, []);


    const loadDashboard = async () => {

        try {

            setLoading(true);

            setError("");


            /* ==========================================
               USER
            ========================================== */

            const storedUser =
                localStorage.getItem("user");


            if (storedUser) {

                try {

                    setUser(
                        JSON.parse(storedUser)
                    );

                } catch (error) {

                    console.error(
                        "User parsing error:",
                        error
                    );

                }

            }


            /* ==========================================
               ACCOUNT
            ========================================== */

            const accountResponse =
                await api.get("/accounts");


            console.log(
                "Account response:",
                accountResponse.data
            );


            if (
                accountResponse.data?.success
            ) {

                if (
                    accountResponse.data.account
                ) {

                    setAccount(
                        accountResponse.data.account
                    );

                }

                else if (
                    accountResponse.data.accounts &&
                    accountResponse.data.accounts.length > 0
                ) {

                    setAccount(
                        accountResponse.data.accounts[0]
                    );

                }

            }


            /* ==========================================
               TRANSACTIONS
            ========================================== */

            const transactionResponse =
                await api.get("/transactions");


            console.log(
                "Transaction response:",
                transactionResponse.data
            );


            if (
                transactionResponse.data?.success
            ) {

                setTransactions(
                    transactionResponse.data.transactions ||
                    []
                );

            }


        } catch (error: any) {

            console.error(
                "Dashboard loading error:",
                error
            );


            setError(
                error?.response?.data?.message ||
                "Unable to load dashboard information."
            );


        } finally {

            setLoading(false);

        }

    };


    /* ================================================
       FORMAT CURRENCY
    ================================================= */

    const formatCurrency = (
        amount: number
    ) => {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
            }
        ).format(amount);

    };


    /* ================================================
       FORMAT DATE
    ================================================= */

    const formatDate = (
        date: string
    ) => {

        if (!date) {

            return "";

        }


        return new Date(
            date
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );

    };


    /* ================================================
       FORMAT TIME
    ================================================= */

    const formatTime = (
        date: string
    ) => {

        if (!date) {

            return "";

        }


        return new Date(
            date
        ).toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );

    };


    /* ================================================
       TOTAL INCOME

       BLOCKED TRANSACTIONS ARE NOT INCLUDED
    ================================================= */

    const totalIncome =

        transactions

            .filter(
                (transaction) => {

                    const type =
                        transaction.transaction_type
                            ?.toLowerCase();

                    const status =
                        transaction.status
                            ?.toLowerCase();

                    return (
                        type === "deposit" &&
                        status !== "blocked"
                    );

                }
            )

            .reduce(
                (
                    total,
                    transaction
                ) =>

                    total +
                    Number(
                        transaction.amount
                    ),

                0
            );


    /* ================================================
       TOTAL EXPENSES

       BLOCKED TRANSACTIONS ARE NOT INCLUDED
    ================================================= */

    const totalExpenses =

        transactions

            .filter(
                (transaction) => {

                    const type =
                        transaction.transaction_type
                            ?.toLowerCase();

                    const status =
                        transaction.status
                            ?.toLowerCase();

                    return (
                        (
                            type === "withdrawal" ||
                            type === "transfer"
                        ) &&
                        status !== "blocked"
                    );

                }
            )

            .reduce(
                (
                    total,
                    transaction
                ) =>

                    total +
                    Number(
                        transaction.amount
                    ),

                0
            );


    /* ================================================
       LOADING
    ================================================= */

    if (loading) {

        return (

            <div className="dashboard-loading">

                <div className="loading-spinner"></div>

                <h2>
                    Loading Dashboard...
                </h2>

                <p>
                    Fetching your banking information.
                </p>

            </div>

        );

    }


    return (

        <div className="dashboard-page">


            {/* =================================================
                WELCOME
            ================================================== */}

            <section className="dashboard-welcome">

                <div>

                    <p className="welcome-label">
                        Welcome back,
                    </p>


                    <h1>

                        {user?.full_name ||
                            "Customer"}

                    </h1>


                    <p className="welcome-description">

                        Here's your financial overview for today.

                    </p>

                </div>


                <div className="today-card">

                    <span>
                        TODAY
                    </span>


                    <strong>

                        {new Date().toLocaleDateString(
                            "en-GB",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            }
                        )}

                    </strong>

                </div>

            </section>


            {/* =================================================
                ERROR
            ================================================== */}

            {error && (

                <div className="dashboard-error">

                    <span>
                        {error}
                    </span>


                    <button
                        onClick={loadDashboard}
                    >
                        Try Again
                    </button>

                </div>

            )}


            {/* =================================================
                MAIN FINANCIAL ROW

                BALANCE → CARD → INCOME/EXPENSE
            ================================================== */}

            <section className="financial-layout">


                {/* ============================================
                    MAIN BALANCE
                ============================================= */}

                <div className="main-balance-card">

                    <div className="balance-label">
                        MAIN BALANCE
                    </div>


                    <div className="balance-value">

                        {formatCurrency(
                            Number(
                                account?.balance || 0
                            )
                        )}

                    </div>


                    <div className="balance-line"></div>


                    <div className="balance-caption">
                        Available balance
                    </div>

                </div>


                {/* ============================================
                    BANK CARD
                ============================================= */}

                <div className="bank-card">

                    <div className="card-top">

                        <strong>
                            SmartBank
                        </strong>

                        <span>
                            07/26
                        </span>

                    </div>


                    <div className="chip">

                        <span></span>
                        <span></span>
                        <span></span>

                    </div>


                    <div className="card-number">

                        {account?.account_number ||
                            "000000000000"}

                    </div>


                    <div className="card-bottom">

                        <div>

                            <span>
                                CARD HOLDER
                            </span>


                            <strong>

                                {(
                                    user?.full_name ||
                                    "CUSTOMER"
                                ).toUpperCase()}

                            </strong>

                        </div>


                        <div className="mastercard">

                            <span></span>
                            <span></span>

                        </div>

                    </div>

                </div>


                {/* ============================================
                    INCOME + EXPENSES
                ============================================= */}

                <div className="income-expense-column">


                    {/* INCOME */}

                    <div className="summary-card income-card">

                        <div className="summary-icon income-icon">
                            ↑
                        </div>


                        <div className="summary-content">

                            <span>
                                Total Income
                            </span>


                            <strong>

                                {formatCurrency(
                                    totalIncome
                                )}

                            </strong>


                            <small>
                                Total successful deposits
                            </small>

                        </div>


                        <div className="summary-period">
                            Last
                            <br />
                            Month
                        </div>

                    </div>


                    {/* EXPENSE */}

                    <div className="summary-card expense-card">

                        <div className="summary-icon expense-icon">
                            ↓
                        </div>


                        <div className="summary-content">

                            <span>
                                Total Expenses
                            </span>


                            <strong>

                                {formatCurrency(
                                    totalExpenses
                                )}

                            </strong>


                            <small>
                                Withdrawals and transfers
                            </small>

                        </div>


                        <div className="summary-period">
                            Last
                            <br />
                            Month
                        </div>

                    </div>

                </div>

            </section>


            {/* =================================================
                LOWER CONTENT
            ================================================== */}

            <section className="dashboard-lower-grid">


                {/* ============================================
                    RECENT TRANSACTIONS
                ============================================= */}

                <div className="recent-transactions-card">


                    <div className="section-heading">

                        <div>

                            <span>
                                ACTIVITY
                            </span>


                            <h2>
                                Recent Transactions
                            </h2>


                            <p>
                                Your latest banking activity
                            </p>

                        </div>


                        <button
                            className="view-all-button"
                            onClick={() =>
                                navigate(
                                    "/transactions"
                                )
                            }
                        >
                            View All →
                        </button>

                    </div>


                    <div className="dashboard-transaction-list">


                        {transactions.length === 0 ? (

                            <div className="empty-transactions">

                                <h3>
                                    No transactions yet
                                </h3>

                                <p>
                                    Your recent transactions
                                    will appear here.
                                </p>

                            </div>

                        ) : (

                            transactions
                                .slice(0, 5)
                                .map(
                                    (
                                        transaction
                                    ) => {

                                        const type =
                                            transaction.transaction_type
                                                ?.toLowerCase();


                                        const status =
                                            transaction.status
                                                ?.toLowerCase();


                                        const isDeposit =
                                            type === "deposit";


                                        const isTransfer =
                                            type === "transfer";


                                        const isBlocked =
                                            status === "blocked";


                                        const transactionClass =

                                            `dashboard-transaction ${
                                                isBlocked
                                                    ? "blocked"
                                                    : ""
                                            }`;


                                        const circleClass =

                                            `transaction-circle ${
                                                isBlocked
                                                    ? "blocked"
                                                    : isDeposit
                                                        ? "deposit"
                                                        : isTransfer
                                                            ? "transfer"
                                                            : "withdrawal"
                                            }`;


                                        const amountClass =

                                            `transaction-amount-value ${
                                                isBlocked
                                                    ? "blocked"
                                                    : isDeposit
                                                        ? "positive"
                                                        : "negative"
                                            }`;


                                        return (

                                            <div
                                                className={transactionClass}
                                                key={
                                                    transaction.id
                                                }
                                            >


                                                <div className="transaction-info">


                                                    <div
                                                        className={circleClass}
                                                    >

                                                        {isBlocked
                                                            ? "!"
                                                            : isDeposit
                                                                ? "↓"
                                                                : isTransfer
                                                                    ? "↗"
                                                                    : "↑"}

                                                    </div>


                                                    <div>

                                                        <h3>

                                                            {isBlocked
                                                                ? (
                                                                    transaction.description ||
                                                                    "Transaction Blocked"
                                                                )
                                                                : (
                                                                    transaction.description ||
                                                                    transaction.transaction_type
                                                                )}

                                                        </h3>


                                                        <p>

                                                            {isBlocked
                                                                ? "Blocked by AI fraud detection"
                                                                : transaction.transaction_type}

                                                        </p>


                                                        <small>

                                                            {formatDate(
                                                                transaction.created_at
                                                            )}

                                                            {" • "}

                                                            {formatTime(
                                                                transaction.created_at
                                                            )}

                                                        </small>

                                                    </div>

                                                </div>


                                                <div className="transaction-amount">


                                                    <strong
                                                        className={
                                                            amountClass
                                                        }
                                                    >

                                                        {isBlocked
                                                            ? ""
                                                            : isDeposit
                                                                ? "+"
                                                                : "-"}

                                                        {formatCurrency(
                                                            Number(
                                                                transaction.amount
                                                            )
                                                        )}

                                                    </strong>


                                                    <span
                                                        className={
                                                            isBlocked
                                                                ? "success-badge blocked-badge"
                                                                : "success-badge"
                                                        }
                                                    >

                                                        {isBlocked
                                                            ? "BLOCKED"
                                                            : (
                                                                transaction.status ||
                                                                "SUCCESS"
                                                            ).toUpperCase()}

                                                    </span>

                                                </div>


                                            </div>

                                        );

                                    }
                                )

                        )}

                    </div>

                </div>


                {/* ============================================
                    AI SECURITY
                ============================================= */}

                <div className="ai-security-card">

                    <span className="security-label">
                        AI SECURITY
                    </span>


                    <div className="robot-icon">
                        🤖
                    </div>


                    <h2>
                        Fraud Protection
                    </h2>


                    <p>

                        Every transaction is analyzed by
                        our AI fraud detection system to
                        identify potentially suspicious
                        activity.

                    </p>


                    <div className="ai-active">

                        <span></span>

                        AI Protection Active

                    </div>

                </div>


            </section>


        </div>

    );

}


export default Dashboard;