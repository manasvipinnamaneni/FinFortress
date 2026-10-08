const express = require("express");

const router =
    express.Router();


const authenticateToken =
    require("../middleware/authMiddleware");


const {
    getTransactions,
    createTransaction,
    confirmTransaction,
    blockTransaction,
    testFraudDetection
} =
    require("../controllers/transactionController");


// =====================================================
// GET TRANSACTIONS
// =====================================================

router.get(
    "/",
    authenticateToken,
    getTransactions
);


// =====================================================
// CREATE TRANSACTION
// =====================================================

router.post(
    "/",
    authenticateToken,
    createTransaction
);


// =====================================================
// AI FRAUD TEST
// =====================================================

router.post(
    "/fraud-test",
    authenticateToken,
    testFraudDetection
);


// =====================================================
// ALLOW / CONFIRM PENDING TRANSACTION
// =====================================================

router.post(
    "/:id/confirm",
    authenticateToken,
    confirmTransaction
);


// =====================================================
// BLOCK PENDING TRANSACTION
// =====================================================

router.post(
    "/:id/block",
    authenticateToken,
    blockTransaction
);


module.exports = router;