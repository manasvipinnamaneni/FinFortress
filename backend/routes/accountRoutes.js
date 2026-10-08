const express = require("express");

const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

const {
    createAccount,
    getAccount,
    depositMoney,
    withdrawMoney,
    transferMoney
} = require("../controllers/accountController");


// Create account
router.post(
    "/",
    authenticateToken,
    createAccount
);


// Get account
router.get(
    "/",
    authenticateToken,
    getAccount
);


// Deposit
router.post(
    "/deposit",
    authenticateToken,
    depositMoney
);


// Withdrawal
router.post(
    "/withdraw",
    authenticateToken,
    withdrawMoney
);


// Transfer
router.post(
    "/transfer",
    authenticateToken,
    transferMoney
);


module.exports = router;