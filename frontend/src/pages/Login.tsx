import {
    FormEvent,
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import api from "../services/api";


function Login() {

    const navigate =
        useNavigate();


    const [email, setEmail] =
        useState("");


    const [password, setPassword] =
        useState("");


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    /* =========================================================
       LOGIN
    ========================================================= */

    const handleLogin = async (
        event: FormEvent
    ) => {

        event.preventDefault();

        setError("");

        setLoading(true);


        try {

            const response =
                await api.post(
                    "/auth/login",
                    {
                        email,
                        password
                    }
                );


            const data =
                response.data;


            console.log(
                "Login response:",
                data
            );


            const token =
                data.token ||
                data.accessToken ||
                data.access_token;


            const user =
                data.user ||
                data.data?.user ||
                data.data;


            if (!token) {

                throw new Error(
                    "Login successful but access token was not returned."
                );

            }


            /* SAVE TOKEN */

            localStorage.setItem(
                "token",
                token
            );


            /* SAVE USER */

            if (user) {

                localStorage.setItem(
                    "user",
                    JSON.stringify(user)
                );

            }


            /* IMPORTANT */

            window.dispatchEvent(
                new Event(
                    "authChanged"
                )
            );


            /* GO TO DASHBOARD */

            navigate(
                "/dashboard",
                {
                    replace: true
                }
            );


        } catch (err: any) {

            console.error(
                "Login error:",
                err
            );


            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Invalid email or password.";


            setError(message);


            localStorage.removeItem(
                "token"
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="auth-page">

            {/* =================================================
               LEFT PANEL
            ================================================= */}

            <section className="auth-left">

                <div className="auth-left-content">

                    {/* BRAND */}

                    <div className="auth-brand">

                        <div className="auth-brand-logo">
                            F
                        </div>

                        <div>

                            <h1>
                                FinFortress
                            </h1>

                            <span>
                                AI BANKING
                            </span>

                        </div>

                    </div>


                    {/* LABEL */}

                    <div className="auth-pill">

                        <span>
                            ●
                        </span>

                        SECURE INTELLIGENT BANKING

                    </div>


                    {/* HERO */}

                    <h2 className="auth-hero-title">

                        Your smarter

                        <span>
                            banking journey
                            starts here.
                        </span>

                    </h2>


                    <p className="auth-hero-description">

                        Experience modern banking
                        powered by artificial intelligence,
                        real-time fraud detection and
                        intelligent financial security.

                    </p>


                    {/* BANK CARD */}

                    <div className="auth-bank-card">

                        <div className="auth-card-top">

                            <div>

                                <small>
                                    FINFORTRESS ACCOUNT
                                </small>

                                <strong>
                                    AI Protected
                                </strong>

                            </div>


                            <div className="auth-card-symbol">
                                F
                            </div>

                        </div>


                        <div className="auth-card-chip">
                        </div>


                        <div className="auth-card-number">
                            •••• &nbsp; •••• &nbsp; •••• &nbsp; 2026
                        </div>


                        <div className="auth-card-bottom">

                            <span>
                                SECURE BANKING
                            </span>

                            <span>
                                AI • 2026
                            </span>

                        </div>

                    </div>


                    {/* FEATURES */}

                    <div className="auth-feature-list">

                        <div className="auth-feature">

                            <span>
                                ✓
                            </span>

                            <div>

                                <strong>
                                    AI Fraud Protection
                                </strong>

                                <small>
                                    Transactions are
                                    intelligently monitored.
                                </small>

                            </div>

                        </div>


                        <div className="auth-feature">

                            <span>
                                ✓
                            </span>

                            <div>

                                <strong>
                                    Secure Authentication
                                </strong>

                                <small>
                                    Your account stays protected.
                                </small>

                            </div>

                        </div>


                        <div className="auth-feature">

                            <span>
                                ✓
                            </span>

                            <div>

                                <strong>
                                    Smart Financial Insights
                                </strong>

                                <small>
                                    Make better financial decisions.
                                </small>

                            </div>

                        </div>

                    </div>

                </div>


                <div className="auth-footer">

                    <span>
                        © 2026 FinFortress
                    </span>

                    <span>
                        Intelligent • Secure • Strong
                    </span>

                </div>

            </section>


            {/* =================================================
               RIGHT PANEL
            ================================================= */}

            <section className="auth-right">

                <div className="auth-form-container">

                    <div className="auth-form-heading">

                        <span>
                            WELCOME BACK
                        </span>

                        <h2>
                            Sign in to FinFortress
                        </h2>

                        <p>
                            Access your secure AI-powered
                            banking account.
                        </p>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="auth-error">

                            <strong>
                                Login failed
                            </strong>

                            <span>
                                {error}
                            </span>

                        </div>

                    )}


                    {/* FORM */}

                    <form
                        className="auth-form"
                        onSubmit={
                            handleLogin
                        }
                    >

                        {/* EMAIL */}

                        <div className="auth-field">

                            <label>
                                Email Address
                            </label>

                            <div className="auth-input-wrapper">

                                <span>
                                    ✉
                                </span>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={event =>
                                        setEmail(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter your email"
                                    required
                                    autoComplete="email"
                                />

                            </div>

                        </div>


                        {/* PASSWORD */}

                        <div className="auth-field">

                            <label>
                                Password
                            </label>

                            <div className="auth-input-wrapper">

                                <span>
                                    🔒
                                </span>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={event =>
                                        setPassword(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="current-password"
                                />

                            </div>

                        </div>


                        {/* BUTTON */}

                        <button
                            type="submit"
                            className="auth-submit-button"
                            disabled={loading}
                        >

                            {
                                loading
                                    ? "Signing in..."
                                    : "Sign In"
                            }

                            {!loading && (
                                <span>
                                    →
                                </span>
                            )}

                        </button>

                    </form>


                    {/* REGISTER */}

                    <div className="auth-switch">

                        Don't have an account?

                        <Link to="/register">
                            Create Account
                        </Link>

                    </div>


                    {/* SECURITY */}

                    <div className="auth-security-note">

                        <span>
                            ✓
                        </span>

                        <div>

                            <strong>
                                Secure Banking
                            </strong>

                            <small>
                                Your credentials are
                                protected by FinFortress.
                            </small>

                        </div>

                    </div>

                </div>

            </section>

        </div>

    );

}


export default Login;