import {
    FormEvent,
    useState
} from "react";

import {
    Link,
    useNavigate
} from "react-router-dom";

import api from "../services/api";


function Register() {

    const navigate =
        useNavigate();


    const [fullName, setFullName] =
        useState("");


    const [email, setEmail] =
        useState("");


    const [phone, setPhone] =
        useState("");


    const [password, setPassword] =
        useState("");


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    const [success, setSuccess] =
        useState("");


    /* =========================================================
       REGISTER
    ========================================================= */

    const handleRegister = async (
        event: FormEvent
    ) => {

        event.preventDefault();

        setError("");
        setSuccess("");

        setLoading(true);


        try {

            const response =
                await api.post(
                    "/auth/register",
                    {
                        full_name:
                            fullName.trim(),

                        email:
                            email.trim(),

                        phone:
                            phone.trim(),

                        password
                    }
                );


            console.log(
                "Registration response:",
                response.data
            );


            setSuccess(
                "Registration successful! Redirecting to login..."
            );


            /*
             * IMPORTANT:
             *
             * We intentionally DO NOT save a token here.
             *
             * User must login after registration.
             */


            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );


            /*
             * Redirect to login.
             */

            setTimeout(() => {

                navigate(
                    "/login",
                    {
                        replace: true,
                        state: {
                            registrationSuccess:
                                true
                        }
                    }
                );

            }, 1200);


        } catch (err: any) {

            console.error(
                "Registration error:",
                err
            );


            const message =
                err.response?.data?.message ||
                err.response?.data?.error ||
                "Registration failed. Please try again.";


            setError(message);

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

                        JOIN THE FUTURE OF BANKING

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

                        Create your FinFortress account
                        and experience secure, intelligent
                        banking powered by artificial
                        intelligence.

                    </p>


                    {/* CARD */}

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
                                    Every transaction is
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
                            GET STARTED
                        </span>

                        <h2>
                            Create your account
                        </h2>

                        <p>
                            Join FinFortress and start
                            banking smarter today.
                        </p>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="auth-error">

                            <strong>
                                Registration failed
                            </strong>

                            <span>
                                {error}
                            </span>

                        </div>

                    )}


                    {/* SUCCESS */}

                    {success && (

                        <div className="auth-success">

                            <strong>
                                Registration successful
                            </strong>

                            <span>
                                {success}
                            </span>

                        </div>

                    )}


                    {/* FORM */}

                    <form
                        className="auth-form"
                        onSubmit={
                            handleRegister
                        }
                    >

                        {/* FULL NAME */}

                        <div className="auth-field">

                            <label>
                                Full Name
                            </label>

                            <div className="auth-input-wrapper">

                                <span>
                                    ♙
                                </span>

                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={event =>
                                        setFullName(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter your full name"
                                    required
                                    autoComplete="name"
                                />

                            </div>

                        </div>


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


                        {/* PHONE */}

                        <div className="auth-field">

                            <label>
                                Phone Number
                            </label>

                            <div className="auth-input-wrapper">

                                <span>
                                    ☎
                                </span>

                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={event =>
                                        setPhone(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter your phone number"
                                    required
                                    autoComplete="tel"
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
                                    placeholder="Create a password"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                />

                            </div>

                        </div>


                        {/* PASSWORD MESSAGE */}

                        <div className="auth-password-strength">

                            <div>
                            </div>

                            <span>
                                Use at least 6 characters
                            </span>

                        </div>


                        {/* SECURITY */}

                        <div className="auth-security-box">

                            <span>
                                ✓
                            </span>

                            <div>

                                <strong>
                                    Your information is secure
                                </strong>

                                <small>
                                    FinFortress uses secure
                                    authentication to protect
                                    your account.
                                </small>

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
                                    ? "Creating Account..."
                                    : "Create Account"
                            }

                            {!loading && (
                                <span>
                                    →
                                </span>
                            )}

                        </button>

                    </form>


                    {/* LOGIN */}

                    <div className="auth-switch">

                        Already have an account?

                        <Link to="/login">
                            Sign In
                        </Link>

                    </div>


                    {/* LEGAL */}

                    <div className="auth-legal">

                        🔒 &nbsp;

                        By creating an account,
                        your banking information
                        will be protected by FinFortress.

                    </div>

                </div>

            </section>

        </div>

    );

}


export default Register;