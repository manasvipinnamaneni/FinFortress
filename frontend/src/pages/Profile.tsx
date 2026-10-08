import {
    useCallback,
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import api from "../services/api";


interface User {

    id: number;

    full_name: string;

    email: string;

    phone: string;

    role: string;

}


interface Account {

    id: number;

    account_number: string;

    account_type: string;

    balance: number;

    created_at: string;

}


function Profile() {

    const navigate =
        useNavigate();


    const [user, setUser] =
        useState<User | null>(null);


    const [account, setAccount] =
        useState<Account | null>(null);


    const [loading, setLoading] =
        useState(true);


    const [error, setError] =
        useState("");


    const [retrying, setRetrying] =
        useState(false);


    /* =========================================================
       LOAD PROFILE
    ========================================================= */

    const loadProfile =
        useCallback(
            async () => {

                try {

                    setError("");


                    /* =========================================
                       GET PROFILE FROM BACKEND
                    ========================================= */

                    const response =
                        await api.get(
                            "/users/profile"
                        );


                    console.log(
                        "Profile response:",
                        response.data
                    );


                    const responseData =
                        response.data;


                    /* =========================================
                       HANDLE RESPONSE
                    ========================================= */

                    if (
                        responseData?.success
                    ) {

                        const profile =
                            responseData.data;


                        if (
                            profile?.user
                        ) {

                            setUser(
                                profile.user
                            );


                            /*
                            Keep localStorage user
                            synchronized.
                            */

                            localStorage.setItem(
                                "user",
                                JSON.stringify(
                                    profile.user
                                )
                            );

                        }


                        if (
                            profile?.account
                        ) {

                            setAccount(
                                profile.account
                            );


                            localStorage.setItem(
                                "account",
                                JSON.stringify(
                                    profile.account
                                )
                            );

                        } else {

                            /*
                            The user exists but may
                            not have an account.
                            */

                            setAccount(null);

                        }


                    } else {

                        throw new Error(
                            responseData?.message ||
                            "Unable to load profile."
                        );

                    }


                } catch (error: any) {

                    console.error(
                        "Profile loading error:",
                        error
                    );


                    console.error(
                        "Profile server response:",
                        error.response?.data
                    );


                    /*
                    If the API fails, try the user
                    already stored during login.
                    */

                    const storedUser =
                        localStorage.getItem(
                            "user"
                        );


                    if (
                        storedUser
                    ) {

                        try {

                            const parsedUser =
                                JSON.parse(
                                    storedUser
                                );


                            setUser(
                                parsedUser
                            );


                        } catch (
                            parseError
                        ) {

                            console.error(
                                "Stored user parsing error:",
                                parseError
                            );

                        }

                    }


                    setError(
                        error.response?.data?.message ||
                        error.message ||
                        "Unable to load your profile information."
                    );

                } finally {

                    setLoading(false);
                    setRetrying(false);

                }

            },
            []
        );


    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    useEffect(() => {

        loadProfile();

    }, [loadProfile]);


    /* =========================================================
       RETRY
    ========================================================= */

    const handleRetry =
        async () => {

            setRetrying(true);

            setLoading(true);

            await loadProfile();

        };


    /* =========================================================
       FORMAT CURRENCY
    ========================================================= */

    const formatCurrency =
        (amount: number) => {

            return new Intl.NumberFormat(
                "en-IN",
                {
                    style: "currency",
                    currency: "INR",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            ).format(
                Number(amount || 0)
            );

        };


    /* =========================================================
       FORMAT ACCOUNT NUMBER
    ========================================================= */

    const formatAccountNumber =
        (accountNumber: string) => {

            if (
                !accountNumber
            ) {

                return "Not available";

            }


            return accountNumber
                .replace(
                    /\s/g,
                    ""
                )
                .replace(
                    /(.{4})/g,
                    "$1 "
                )
                .trim();

        };


    /* =========================================================
       FORMAT DATE
    ========================================================= */

    const formatDate =
        (date: string) => {

            if (!date) {

                return "Not available";

            }


            return new Date(
                date
            ).toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

        };


    /* =========================================================
       USER INITIAL
    ========================================================= */

    const userInitial =
        user?.full_name
            ?.charAt(0)
            ?.toUpperCase() || "M";


    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {

        return (

            <div className="profile-loading">

                <div className="profile-loading-card">

                    <div className="profile-loading-spinner">
                    </div>

                    <h2>
                        Loading Profile...
                    </h2>

                    <p>
                        Fetching your account information.
                    </p>

                </div>

            </div>

        );

    }


    /* =========================================================
       PAGE
    ========================================================= */

    return (

        <div className="profile-page">

            {/* =================================================
               PAGE HEADER
            ================================================= */}

            <div className="profile-page-header">

                <div>

                    <span className="profile-page-label">
                        ACCOUNT
                    </span>

                    <h1>
                        My Profile
                    </h1>

                    <p>
                        Manage your personal information
                        and banking account details.
                    </p>

                </div>


                <button
                    type="button"
                    className="profile-dashboard-button"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    ← Dashboard
                </button>

            </div>


            {/* =================================================
               ERROR
            ================================================= */}

            {error && (

                <div className="profile-inline-error">

                    <span>
                        !
                    </span>

                    <div>

                        <strong>
                            Unable to load some profile information
                        </strong>

                        <p>
                            {error}
                        </p>

                    </div>

                    <button
                        type="button"
                        onClick={handleRetry}
                        disabled={retrying}
                    >
                        {retrying
                            ? "Retrying..."
                            : "Try Again"}
                    </button>

                </div>

            )}


            {/* =================================================
               PROFILE GRID
            ================================================= */}

            <div className="profile-grid">

                {/* =============================================
                   PERSONAL INFORMATION
                ============================================= */}

                <section className="profile-card">

                    <div className="profile-card-label">
                        PERSONAL INFORMATION
                    </div>


                    <div className="profile-user-header">

                        <div className="profile-avatar">
                            {userInitial}
                        </div>


                        <div>

                            <h3>
                                {user?.full_name ||
                                    "Customer"}
                            </h3>

                            <p>
                                {user?.role ||
                                    "Customer"}
                            </p>

                        </div>

                    </div>


                    <div className="profile-divider">
                    </div>


                    <div className="profile-details-grid">

                        <div className="profile-detail">

                            <span>
                                Full Name
                            </span>

                            <strong>
                                {user?.full_name ||
                                    "Not available"}
                            </strong>

                        </div>


                        <div className="profile-detail">

                            <span>
                                Email Address
                            </span>

                            <strong>
                                {user?.email ||
                                    "Not available"}
                            </strong>

                        </div>


                        <div className="profile-detail">

                            <span>
                                Phone Number
                            </span>

                            <strong>
                                {user?.phone ||
                                    "Not available"}
                            </strong>

                        </div>


                        <div className="profile-detail">

                            <span>
                                Account Role
                            </span>

                            <strong>
                                {user?.role ||
                                    "Customer"}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =============================================
                   ACCOUNT INFORMATION
                ============================================= */}

                <section className="profile-card">

                    <div className="profile-card-label">
                        BANK ACCOUNT
                    </div>


                    {account ? (

                        <>

                            <div className="profile-balance-card">

                                <span>
                                    AVAILABLE BALANCE
                                </span>

                                <strong>
                                    {formatCurrency(
                                        Number(
                                            account.balance
                                        )
                                    )}
                                </strong>

                            </div>


                            <div className="profile-account-details">

                                <div className="profile-account-row">

                                    <span>
                                        Account Number
                                    </span>

                                    <strong>
                                        {formatAccountNumber(
                                            account.account_number
                                        )}
                                    </strong>

                                </div>


                                <div className="profile-account-row">

                                    <span>
                                        Account Type
                                    </span>

                                    <strong>
                                        {account.account_type ||
                                            "Savings"}
                                    </strong>

                                </div>


                                <div className="profile-account-row">

                                    <span>
                                        Account Status
                                    </span>

                                    <strong className="profile-active-status">

                                        <span className="profile-status-dot">
                                        </span>

                                        Active

                                    </strong>

                                </div>


                                <div className="profile-account-row">

                                    <span>
                                        Created On
                                    </span>

                                    <strong>
                                        {formatDate(
                                            account.created_at
                                        )}
                                    </strong>

                                </div>

                            </div>

                        </>

                    ) : (

                        <div className="profile-no-account">

                            <div className="profile-no-account-icon">
                                !
                            </div>

                            <h3>
                                Bank account unavailable
                            </h3>

                            <p>
                                Your user profile exists, but
                                no bank account is currently
                                associated with it.
                            </p>

                        </div>

                    )}

                </section>


            </div>


            {/* =================================================
               SECURITY CARD
            ================================================= */}

            <section className="profile-security-card">

                <div className="profile-security-header">

                    <div className="profile-security-icon">
                        ✓
                    </div>

                    <div>

                        <h2>
                            SmartBank Security
                        </h2>

                        <p>
                            Your account is protected by
                            SmartBank's security system.
                        </p>

                    </div>

                </div>


                <div className="profile-security-items">

                    <div>

                        <span className="security-check">
                            ✓
                        </span>

                        <span>
                            Secure authentication
                        </span>

                    </div>


                    <div>

                        <span className="security-check">
                            ✓
                        </span>

                        <span>
                            AI fraud protection
                        </span>

                    </div>


                    <div>

                        <span className="security-check">
                            ✓
                        </span>

                        <span>
                            Protected transactions
                        </span>

                    </div>

                </div>

            </section>

        </div>

    );

}


export default Profile;