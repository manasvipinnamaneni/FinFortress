const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const accountRoutes = require("./routes/accountRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

app.use(cors());
app.use(express.json());


// =====================================================
// ROOT
// =====================================================

app.get("/", (req, res) => {
    res.json({
        message: "AI Smart Banking System Backend is running"
    });
});


// =====================================================
// TEST DATABASE
// =====================================================

app.get("/api/test-db", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT 1 AS result"
        );

        res.json({
            success: true,
            message: "Database connection is working",
            data: rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});


// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/accounts", accountRoutes);

app.use("/api/transactions", transactionRoutes);


// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server running on http://localhost:${PORT}`
    );
});