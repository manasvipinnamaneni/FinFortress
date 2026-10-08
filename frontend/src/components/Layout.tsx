import { useEffect, useState } from "react";
import {
    NavLink,
    Outlet,
    useLocation,
    useNavigate
} from "react-router-dom";

function Layout() {
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarCollapsed, setSidebarCollapsed] =
        useState(
            localStorage.getItem("sidebarCollapsed") === "true"
        );

    const [darkMode, setDarkMode] =
        useState(
            localStorage.getItem("darkMode") === "true"
        );

    const [user, setUser] = useState<any>(null);

    /*
     * Load logged-in user
     */
    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error(
                    "User parsing error:",
                    error
                );
            }
        }
    }, []);

    /*
     * Sidebar collapsed state
     */
    useEffect(() => {
        localStorage.setItem(
            "sidebarCollapsed",
            String(sidebarCollapsed)
        );

        window.dispatchEvent(
            new Event("settingsChanged")
        );
    }, [sidebarCollapsed]);
    useEffect(() => {
    const syncSettings = () => {
        const savedSidebarState =
            localStorage.getItem("sidebarCollapsed") === "true";

        const savedDarkMode =
            localStorage.getItem("darkMode") === "true";

        setSidebarCollapsed(savedSidebarState);
        setDarkMode(savedDarkMode);
    };

    window.addEventListener(
        "settingsChanged",
        syncSettings
    );

    return () => {
        window.removeEventListener(
            "settingsChanged",
            syncSettings
        );
    };
}, []);

    /*
     * Dark mode
     */
    useEffect(() => {
        document.body.classList.toggle(
            "dark-mode",
            darkMode
        );

        localStorage.setItem(
            "darkMode",
            String(darkMode)
        );

        window.dispatchEvent(
            new Event("settingsChanged")
        );

        return () => {
            document.body.classList.remove(
                "dark-mode"
            );
        };
    }, [darkMode]);

    /*
     * Toggle sidebar
     */
    const toggleSidebar = () => {
        setSidebarCollapsed(
            previous => !previous
        );
    };

    /*
     * Toggle dark mode
     */
    const toggleDarkMode = () => {
        setDarkMode(
            previous => !previous
        );
    };

    /*
     * Logout
     */
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    /*
     * Sidebar link styling
     */
    const sidebarLinkClass = ({
        isActive
    }: {
        isActive: boolean;
    }) => {
        return `sidebar-link ${
            isActive ? "active" : ""
        }`;
    };

    /*
     * Page titles
     */
    const pageTitles: Record<string, string> = {
        "/dashboard": "Dashboard",
        "/transactions": "Transactions",
        "/make-transaction": "Make Transaction",
        "/profile": "My Profile",
        "/settings": "Settings"
    };

    const pageTitle =
        pageTitles[location.pathname] || "FinFortress";

    return (
        <div
            className={`app-layout ${
                sidebarCollapsed
                    ? "sidebar-collapsed"
                    : ""
            }`}
        >

            {/* =====================================================
                SIDEBAR
            ====================================================== */}

            <aside className="sidebar">

                {/* BRAND */}
                <div className="sidebar-brand">

                    {/* FinFortress Logo */}
                    <div className="brand-logo">

                        <svg
                            viewBox="0 0 64 64"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-label="FinFortress logo"
                            role="img"
                        >
                            {/* Shield */}
                            <path
                                d="M32 4L54 12V29C54 43 45 55 32 60C19 55 10 43 10 29V12L32 4Z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinejoin="round"
                            />

                            {/* F - Top */}
                            <path
                                d="M22 20H43"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />

                            {/* F - Middle */}
                            <path
                                d="M22 29H38"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />

                            {/* F - Vertical */}
                            <path
                                d="M22 20V43"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />

                            {/* Security line */}
                            <path
                                d="M22 38H34"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        </svg>

                    </div>

                    {/* Brand Text */}
                    <div className="brand-text">

                        <h1>
                            FinFortress
                        </h1>

                        <span>
                            AI BANKING
                        </span>

                    </div>

                </div>


                {/* SIDEBAR COLLAPSE BUTTON */}
                <button
                    type="button"
                    className="sidebar-collapse-button"
                    onClick={toggleSidebar}
                    title={
                        sidebarCollapsed
                            ? "Expand sidebar"
                            : "Collapse sidebar"
                    }
                    aria-label={
                        sidebarCollapsed
                            ? "Expand sidebar"
                            : "Collapse sidebar"
                    }
                >
                    <span>
                        {sidebarCollapsed
                            ? "›"
                            : "←"}
                    </span>

                    <span className="collapse-button-text">
                        {sidebarCollapsed
                            ? "Expand Sidebar"
                            : "Collapse Sidebar"}
                    </span>
                </button>


                {/* SIDEBAR MENU */}
                <div className="sidebar-menu">

                    {/* MAIN MENU */}
                    <div className="menu-title">
                        MAIN MENU
                    </div>

                    <nav>

                        {/* Dashboard */}
                        <NavLink
                            to="/dashboard"
                            className={sidebarLinkClass}
                        >
                            <span className="sidebar-icon">
                                ▣
                            </span>

                            <span className="sidebar-link-text">
                                Dashboard
                            </span>
                        </NavLink>


                        {/* Transactions */}
                        <NavLink
                            to="/transactions"
                            className={sidebarLinkClass}
                        >
                            <span className="sidebar-icon">
                                ⇄
                            </span>

                            <span className="sidebar-link-text">
                                Transactions
                            </span>
                        </NavLink>


                        {/* Make Transaction */}
                        <NavLink
                            to="/make-transaction"
                            className={sidebarLinkClass}
                        >
                            <span className="sidebar-icon">
                                ＋
                            </span>

                            <span className="sidebar-link-text">
                                Make Transaction
                            </span>
                        </NavLink>

                    </nav>


                    {/* ACCOUNT */}
                    <div
                        className="menu-title"
                        style={{
                            marginTop: "30px"
                        }}
                    >
                        ACCOUNT
                    </div>

                    <nav>

                        {/* Profile */}
                        <NavLink
                            to="/profile"
                            className={sidebarLinkClass}
                        >
                            <span className="sidebar-icon">
                                ◎
                            </span>

                            <span className="sidebar-link-text">
                                My Profile
                            </span>
                        </NavLink>


                        {/* Settings */}
                        <NavLink
                            to="/settings"
                            className={sidebarLinkClass}
                        >
                            <span className="sidebar-icon">
                                ⚙
                            </span>

                            <span className="sidebar-link-text">
                                Settings
                            </span>
                        </NavLink>

                    </nav>

                </div>


                {/* SIDEBAR BOTTOM */}
                <div className="sidebar-bottom">

                    {/* AI Protection */}
                    <div className="security-box">

                        <div className="security-icon">
                            ✓
                        </div>

                        <div className="security-text">

                            <strong>
                                AI Protection
                            </strong>

                            <span>
                                Active
                            </span>

                        </div>

                    </div>


                    {/* Theme */}
                    <button
                        type="button"
                        className="sidebar-theme-button"
                        onClick={toggleDarkMode}
                        title={
                            darkMode
                                ? "Switch to light mode"
                                : "Switch to dark mode"
                        }
                    >

                        <span className="sidebar-icon">
                            {darkMode
                                ? "☀"
                                : "☾"}
                        </span>

                        <span className="sidebar-link-text">
                            {darkMode
                                ? "Light Mode"
                                : "Dark Mode"}
                        </span>

                    </button>


                    {/* Logout */}
                    <button
                        type="button"
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >

                        <span className="sidebar-icon">
                            ↪
                        </span>

                        <span className="sidebar-link-text">
                            Logout
                        </span>

                    </button>

                </div>

            </aside>


            {/* =====================================================
                MAIN CONTENT
            ====================================================== */}

            <main className="app-main">

                {/* HEADER */}
                <header className="app-header">

                    {/* LEFT */}
                    <div className="header-left">

                        {/* NO FINFORTRESS HERE */}
                        <h2>
                            {pageTitle}
                        </h2>

                    </div>


                    {/* RIGHT */}
                    <div className="header-right">

                        {/* Theme Button */}
                        <button
                            type="button"
                            className="notification-button"
                            onClick={toggleDarkMode}
                            title={
                                darkMode
                                    ? "Light mode"
                                    : "Dark mode"
                            }
                        >
                            {darkMode
                                ? "☀"
                                : "☾"}
                        </button>


                        {/* User */}
                        <div
                            className="header-user"
                            onClick={() =>
                                navigate("/profile")
                            }
                            role="button"
                            tabIndex={0}
                            onKeyDown={event => {

                                if (
                                    event.key ===
                                    "Enter"
                                ) {
                                    navigate(
                                        "/profile"
                                    );
                                }

                            }}
                        >

                            {/* Avatar */}
                            <div className="header-avatar">

                                {user?.full_name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                    "M"}

                            </div>


                            {/* User Info */}
                            <div className="header-user-info">

                                <strong>
                                    {user?.full_name ||
                                        "Customer"}
                                </strong>

                                <span>
                                    Personal Account
                                </span>

                            </div>

                        </div>

                    </div>

                </header>


                {/* PAGE CONTENT */}
                <div className="page-content">

                    <Outlet />

                </div>

            </main>

        </div>
    );
}

export default Layout;