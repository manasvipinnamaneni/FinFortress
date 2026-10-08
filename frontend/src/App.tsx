import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from "react-router-dom";


import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import MakeTransaction from "./pages/MakeTransaction";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";


import Layout from "./components/Layout";


function App() {

    const token =
        localStorage.getItem("token");


    return (

        <BrowserRouter>

            <Routes>

                {/* =================================================
                   PUBLIC ROUTES
                ================================================= */}

                <Route
                    path="/login"
                    element={
                        <Login />
                    }
                />


                <Route
                    path="/register"
                    element={
                        <Register />
                    }
                />


                {/* =================================================
                   PROTECTED ROUTES
                ================================================= */}

                <Route

                    element={
                        token ? (

                            <Layout />

                        ) : (

                            <Navigate
                                to="/login"
                                replace
                            />

                        )
                    }

                >

                    <Route
                        path="/dashboard"
                        element={
                            <Dashboard />
                        }
                    />


                    <Route
                        path="/transactions"
                        element={
                            <Transactions />
                        }
                    />


                    <Route
                        path="/make-transaction"
                        element={
                            <MakeTransaction />
                        }
                    />


                    <Route
                        path="/profile"
                        element={
                            <Profile />
                        }
                    />


                    <Route
                        path="/settings"
                        element={
                            <Settings />
                        }
                    />

                </Route>


                {/* =================================================
                   ROOT
                ================================================= */}

                <Route
                    path="/"
                    element={

                        <Navigate
                            to={
                                token
                                    ? "/dashboard"
                                    : "/login"
                            }
                            replace
                        />

                    }
                />


                {/* =================================================
                   UNKNOWN ROUTE
                ================================================= */}

                <Route
                    path="*"
                    element={

                        <Navigate
                            to={
                                token
                                    ? "/dashboard"
                                    : "/login"
                            }
                            replace
                        />

                    }
                />

            </Routes>

        </BrowserRouter>

    );

}


export default App;