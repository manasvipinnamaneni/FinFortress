import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Settings() {

    const navigate = useNavigate();


    /* =====================================================
       SETTINGS STATE
    ===================================================== */

    const [darkMode, setDarkMode] =
        useState<boolean>(
            localStorage.getItem("darkMode") === "true"
        );


    const [sidebarCollapsed, setSidebarCollapsed] =
        useState<boolean>(
            localStorage.getItem(
                "sidebarCollapsed"
            ) === "true"
        );


    const [transactionNotifications, setTransactionNotifications] =
        useState<boolean>(
            localStorage.getItem(
                "transactionNotifications"
            ) !== "false"
        );


    const [fraudAlerts, setFraudAlerts] =
        useState<boolean>(
            localStorage.getItem(
                "fraudAlerts"
            ) !== "false"
        );


    const [currency, setCurrency] =
        useState<string>(
            localStorage.getItem(
                "currency"
            ) || "INR"
        );


    const [dateFormat, setDateFormat] =
        useState<string>(
            localStorage.getItem(
                "dateFormat"
            ) || "DD/MM/YYYY"
        );


    /* =====================================================
       DARK MODE ON LOAD
    ===================================================== */

    useEffect(() => {

        document.body.classList.toggle(
            "dark-mode",
            darkMode
        );

    }, [darkMode]);


    /* =====================================================
       SAVE SETTINGS
    ===================================================== */

    const notifySettingsChanged = () => {

        window.dispatchEvent(
            new Event("settingsChanged")
        );

    };


    /* =====================================================
       TOGGLE DARK MODE
    ===================================================== */

    const toggleDarkMode = () => {

        const newValue =
            !darkMode;

        setDarkMode(newValue);

        localStorage.setItem(
            "darkMode",
            String(newValue)
        );

        document.body.classList.toggle(
            "dark-mode",
            newValue
        );

        notifySettingsChanged();
    };


    /* =====================================================
       TOGGLE SIDEBAR
    ===================================================== */

    const toggleSidebar = () => {

        const newValue =
            !sidebarCollapsed;

        setSidebarCollapsed(
            newValue
        );

        localStorage.setItem(
            "sidebarCollapsed",
            String(newValue)
        );

        /*
           THIS IS THE IMPORTANT PART.

           It tells Layout.tsx to immediately update
           the actual sidebar.
        */

        window.dispatchEvent(
            new Event("settingsChanged")
        );
    };


    /* =====================================================
       TRANSACTION NOTIFICATIONS
    ===================================================== */

    const toggleTransactionNotifications = () => {

        const newValue =
            !transactionNotifications;

        setTransactionNotifications(
            newValue
        );

        localStorage.setItem(
            "transactionNotifications",
            String(newValue)
        );

        notifySettingsChanged();
    };


    /* =====================================================
       FRAUD ALERTS
    ===================================================== */

    const toggleFraudAlerts = () => {

        const newValue =
            !fraudAlerts;

        setFraudAlerts(
            newValue
        );

        localStorage.setItem(
            "fraudAlerts",
            String(newValue)
        );

        notifySettingsChanged();
    };


    /* =====================================================
       CURRENCY
    ===================================================== */

    const handleCurrencyChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {

        const value =
            event.target.value;

        setCurrency(value);

        localStorage.setItem(
            "currency",
            value
        );

        notifySettingsChanged();
    };


    /* =====================================================
       DATE FORMAT
    ===================================================== */

    const handleDateFormatChange = (
        event: React.ChangeEvent<HTMLSelectElement>
    ) => {

        const value =
            event.target.value;

        setDateFormat(value);

        localStorage.setItem(
            "dateFormat",
            value
        );

        notifySettingsChanged();
    };


    /* =====================================================
       RESET SETTINGS
    ===================================================== */

    const resetSettings = () => {

        const defaultDarkMode =
            false;

        const defaultSidebar =
            false;

        const defaultTransactionNotifications =
            true;

        const defaultFraudAlerts =
            true;

        const defaultCurrency =
            "INR";

        const defaultDateFormat =
            "DD/MM/YYYY";


        setDarkMode(
            defaultDarkMode
        );

        setSidebarCollapsed(
            defaultSidebar
        );

        setTransactionNotifications(
            defaultTransactionNotifications
        );

        setFraudAlerts(
            defaultFraudAlerts
        );

        setCurrency(
            defaultCurrency
        );

        setDateFormat(
            defaultDateFormat
        );


        localStorage.setItem(
            "darkMode",
            String(defaultDarkMode)
        );

        localStorage.setItem(
            "sidebarCollapsed",
            String(defaultSidebar)
        );

        localStorage.setItem(
            "transactionNotifications",
            String(
                defaultTransactionNotifications
            )
        );

        localStorage.setItem(
            "fraudAlerts",
            String(
                defaultFraudAlerts
            )
        );

        localStorage.setItem(
            "currency",
            defaultCurrency
        );

        localStorage.setItem(
            "dateFormat",
            defaultDateFormat
        );


        document.body.classList.toggle(
            "dark-mode",
            defaultDarkMode
        );


        window.dispatchEvent(
            new Event("settingsChanged")
        );
    };


    return (

        <div className="settings-page">

            {/* =================================================
                SETTINGS HEADER
            ================================================= */}

            <div className="settings-header">

                <div>

                    <div className="settings-label">
                        PREFERENCES
                    </div>

                    <p>
                        Manage your SmartBank
                        preferences, appearance
                        and security.
                    </p>

                </div>


                <button
                    type="button"
                    className="settings-dashboard-button"
                    onClick={() =>
                        navigate(
                            "/dashboard"
                        )
                    }
                >
                    ← Dashboard
                </button>

            </div>


            {/* =================================================
                SETTINGS GRID
            ================================================= */}

            <div className="settings-grid">

                {/* =================================================
                    APPEARANCE
                ================================================= */}

                <div className="settings-card">

                    <div className="settings-card-heading">

                        <div className="settings-card-icon">
                            ◐
                        </div>

                        <div>

                            <h2>
                                Appearance
                            </h2>

                            <p>
                                Customize how
                                SmartBank looks.
                            </p>

                        </div>

                    </div>


                    <div className="settings-divider" />


                    {/* DARK MODE */}

                    <div className="setting-row">

                        <div className="setting-info">

                            <strong>
                                Dark Mode
                            </strong>

                            <span>
                                Use the dark theme
                                across SmartBank.
                            </span>

                        </div>


                        <button
                            type="button"
                            className={`settings-switch ${
                                darkMode
                                    ? "on"
                                    : ""
                            }`}
                            onClick={
                                toggleDarkMode
                            }
                            aria-label="Toggle dark mode"
                        >

                            <span />

                        </button>

                    </div>


                    {/* SIDEBAR */}

                    <div className="setting-row">

                        <div className="setting-info">

                            <strong>
                                Collapsed Sidebar
                            </strong>

                            <span>
                                Keep the navigation
                                sidebar compact.
                            </span>

                        </div>


                        <button
                            type="button"
                            className={`settings-switch ${
                                sidebarCollapsed
                                    ? "on"
                                    : ""
                            }`}
                            onClick={
                                toggleSidebar
                            }
                            aria-label="Toggle collapsed sidebar"
                        >

                            <span />

                        </button>

                    </div>

                </div>


                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}

                <div className="settings-card">

                    <div className="settings-card-heading">

                        <div className="settings-card-icon">
                            🔔
                        </div>

                        <div>

                            <h2>
                                Notifications
                            </h2>

                            <p>
                                Control banking
                                alerts and
                                notifications.
                            </p>

                        </div>

                    </div>


                    <div className="settings-divider" />


                    {/* TRANSACTION ALERTS */}

                    <div className="setting-row">

                        <div className="setting-info">

                            <strong>
                                Transaction Alerts
                            </strong>

                            <span>
                                Receive notifications
                                for account
                                transactions.
                            </span>

                        </div>


                        <button
                            type="button"
                            className={`settings-switch ${
                                transactionNotifications
                                    ? "on"
                                    : ""
                            }`}
                            onClick={
                                toggleTransactionNotifications
                            }
                            aria-label="Toggle transaction alerts"
                        >

                            <span />

                        </button>

                    </div>


                    {/* FRAUD ALERTS */}

                    <div className="setting-row">

                        <div className="setting-info">

                            <strong>
                                Fraud Alerts
                            </strong>

                            <span>
                                Get notified when AI
                                detects suspicious
                                activity.
                            </span>

                        </div>


                        <button
                            type="button"
                            className={`settings-switch ${
                                fraudAlerts
                                    ? "on"
                                    : ""
                            }`}
                            onClick={
                                toggleFraudAlerts
                            }
                            aria-label="Toggle fraud alerts"
                        >

                            <span />

                        </button>

                    </div>

                </div>


                {/* =================================================
                    PREFERENCES
                ================================================= */}

                <div className="settings-card">

                    <div className="settings-card-heading">

                        <div className="settings-card-icon">
                            ⚙
                        </div>

                        <div>

                            <h2>
                                Preferences
                            </h2>

                            <p>
                                Set your preferred
                                regional settings.
                            </p>

                        </div>

                    </div>


                    <div className="settings-divider" />


                    {/* CURRENCY */}

                    <div className="setting-select-row">

                        <div className="setting-info">

                            <strong>
                                Currency
                            </strong>

                            <span>
                                Currency used
                                throughout
                                SmartBank.
                            </span>

                        </div>


                        <select
                            value={currency}
                            onChange={
                                handleCurrencyChange
                            }
                        >

                            <option value="INR">
                                INR (₹)
                            </option>

                            <option value="USD">
                                USD ($)
                            </option>

                            <option value="EUR">
                                EUR (€)
                            </option>

                            <option value="GBP">
                                GBP (£)
                            </option>

                        </select>

                    </div>


                    {/* DATE FORMAT */}

                    <div className="setting-select-row">

                        <div className="setting-info">

                            <strong>
                                Date Format
                            </strong>

                            <span>
                                Choose how dates
                                are displayed.
                            </span>

                        </div>


                        <select
                            value={dateFormat}
                            onChange={
                                handleDateFormatChange
                            }
                        >

                            <option value="DD/MM/YYYY">
                                DD/MM/YYYY
                            </option>

                            <option value="MM/DD/YYYY">
                                MM/DD/YYYY
                            </option>

                            <option value="YYYY-MM-DD">
                                YYYY-MM-DD
                            </option>

                        </select>

                    </div>

                </div>


                {/* =================================================
                    SECURITY
                ================================================= */}

                <div className="settings-card">

                    <div className="settings-card-heading">

                        <div className="settings-card-icon">
                            ♡
                        </div>

                        <div>

                            <h2>
                                Security
                            </h2>

                            <p>
                                Manage your SmartBank
                                account security.
                            </p>

                        </div>

                    </div>


                    <div className="settings-divider" />


                    {/* AI FRAUD */}

                    <div className="settings-security-row">

                        <div className="security-status-icon">
                            ✓
                        </div>

                        <div>

                            <strong>
                                AI Fraud Protection
                            </strong>

                            <span>
                                Active and protecting
                                your transactions.
                            </span>

                        </div>

                        <span className="security-active-badge">
                            ACTIVE
                        </span>

                    </div>


                    {/* PROFILE */}

                    <button
                        type="button"
                        className="settings-action"
                        onClick={() =>
                            navigate(
                                "/profile"
                            )
                        }
                    >

                        <div>

                            <strong>
                                My Profile
                            </strong>

                            <span>
                                View your personal
                                and banking
                                information.
                            </span>

                        </div>

                        <span>
                            →
                        </span>

                    </button>


                    {/* PASSWORD */}

                    <button
                        type="button"
                        className="settings-action"
                    >

                        <div>

                            <strong>
                                Change Password
                            </strong>

                            <span>
                                Update your account
                                password securely.
                            </span>

                        </div>

                        <span>
                            →
                        </span>

                    </button>

                </div>

            </div>


            {/* =================================================
                ACCOUNT ACTIONS
            ================================================= */}

            <div className="settings-account-card">

                <div>

                    <h2>
                        Account Actions
                    </h2>

                    <p>
                        Reset your SmartBank
                        preferences to their
                        default values.
                    </p>

                </div>


                <button
                    type="button"
                    className="settings-reset-button"
                    onClick={
                        resetSettings
                    }
                >
                    Reset Settings
                </button>

            </div>

        </div>
    );
}

export default Settings;