const db = require("../config/db");

const generateAccountNumber = () => {
    const timestamp = Date.now().toString();

    const randomPart = Math.floor(
        1000 + Math.random() * 9000
    ).toString();

    return timestamp.slice(-8) + randomPart;
};


// =====================================================
// CREATE ACCOUNT
// =====================================================

const createAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        const [existingAccounts] = await db.query(
            "SELECT id FROM accounts WHERE user_id = ?",
            [userId]
        );

        if (existingAccounts.length > 0) {
            return res.status(409).json({
                success: false,
                message: "User already has a bank account"
            });
        }

        const accountNumber = generateAccountNumber();

        const [result] = await db.query(
            `INSERT INTO accounts
            (user_id, account_number, account_type, balance)
            VALUES (?, ?, ?, ?)`,
            [
                userId,
                accountNumber,
                "savings",
                0.00
            ]
        );

        res.status(201).json({
            success: true,
            message: "Bank account created successfully",
            account: {
                id: result.insertId,
                account_number: accountNumber,
                account_type: "savings",
                balance: 0.00
            }
        });

    } catch (error) {
        console.error("Account creation error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while creating account"
        });
    }
};


// =====================================================
// GET ACCOUNT
// =====================================================

const getAccount = async (req, res) => {
    try {
        const userId = req.user.id;

        const [accounts] = await db.query(
            `SELECT
                id,
                account_number,
                account_type,
                balance,
                created_at
             FROM accounts
             WHERE user_id = ?`,
            [userId]
        );

        if (accounts.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Bank account not found"
            });
        }

        res.status(200).json({
            success: true,
            account: accounts[0]
        });

    } catch (error) {
        console.error("Get account error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while retrieving account"
        });
    }
};


// =====================================================
// DEPOSIT
// =====================================================

const depositMoney = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const userId = req.user.id;
        const { amount, description } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            connection.release();

            return res.status(400).json({
                success: false,
                message: "Deposit amount must be greater than zero"
            });
        }

        // Start transaction
        await connection.beginTransaction();

        // Find user's account
        const [accounts] = await connection.query(
            `SELECT id, balance
             FROM accounts
             WHERE user_id = ?
             FOR UPDATE`,
            [userId]
        );

        if (accounts.length === 0) {
            await connection.rollback();
            connection.release();

            return res.status(404).json({
                success: false,
                message: "Bank account not found"
            });
        }

        const account = accounts[0];

        const newBalance =
            Number(account.balance) + Number(amount);

        // Update balance
        await connection.query(
            `UPDATE accounts
             SET balance = ?
             WHERE id = ?`,
            [newBalance, account.id]
        );

        // Record transaction
        await connection.query(
            `INSERT INTO transactions
            (
                account_id,
                transaction_type,
                amount,
                description,
                status
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                account.id,
                "deposit",
                amount,
                description || "Money deposited",
                "SUCCESS"
            ]
        );

        // Commit
        await connection.commit();

        connection.release();

        res.status(200).json({
            success: true,
            message: "Money deposited successfully",
            account: {
                balance: newBalance
            }
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error("Deposit error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during deposit"
        });
    }
};


// =====================================================
// WITHDRAW
// =====================================================

const withdrawMoney = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const userId = req.user.id;
        const { amount, description } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            connection.release();

            return res.status(400).json({
                success: false,
                message: "Withdrawal amount must be greater than zero"
            });
        }

        // Start transaction
        await connection.beginTransaction();

        // Find account
        const [accounts] = await connection.query(
            `SELECT id, balance
             FROM accounts
             WHERE user_id = ?
             FOR UPDATE`,
            [userId]
        );

        if (accounts.length === 0) {
            await connection.rollback();
            connection.release();

            return res.status(404).json({
                success: false,
                message: "Bank account not found"
            });
        }

        const account = accounts[0];

        // Check balance
        if (Number(account.balance) < Number(amount)) {

            await connection.rollback();
            connection.release();

            return res.status(400).json({
                success: false,
                message: "Insufficient account balance"
            });
        }

        const newBalance =
            Number(account.balance) - Number(amount);

        // Update balance
        await connection.query(
            `UPDATE accounts
             SET balance = ?
             WHERE id = ?`,
            [newBalance, account.id]
        );

        // Record transaction
        await connection.query(
            `INSERT INTO transactions
            (
                account_id,
                transaction_type,
                amount,
                description,
                status
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                account.id,
                "withdrawal",
                amount,
                description || "Money withdrawn",
                "SUCCESS"
            ]
        );

        // Commit
        await connection.commit();

        connection.release();

        res.status(200).json({
            success: true,
            message: "Money withdrawn successfully",
            account: {
                balance: newBalance
            }
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error("Withdrawal error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during withdrawal"
        });
    }
};

// =====================================================
// TRANSFER MONEY
// =====================================================

const transferMoney = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const senderUserId = req.user.id;

        const {
            recipient_account,
            amount,
            description
        } = req.body;

        // Validate input
        if (!recipient_account || !amount || amount <= 0) {
            connection.release();

            return res.status(400).json({
                success: false,
                message: "Recipient account and valid amount are required"
            });
        }

        await connection.beginTransaction();

        // -------------------------------------------------
        // 1. Find sender account
        // -------------------------------------------------

        const [senderAccounts] = await connection.query(
            `SELECT id, account_number, balance
             FROM accounts
             WHERE user_id = ?
             FOR UPDATE`,
            [senderUserId]
        );

        if (senderAccounts.length === 0) {
            await connection.rollback();
            connection.release();

            return res.status(404).json({
                success: false,
                message: "Sender account not found"
            });
        }

        const senderAccount = senderAccounts[0];

        // -------------------------------------------------
        // 2. Check sender isn't transferring to themselves
        // -------------------------------------------------

        if (
            senderAccount.account_number === recipient_account
        ) {
            await connection.rollback();
            connection.release();

            return res.status(400).json({
                success: false,
                message: "You cannot transfer money to your own account"
            });
        }

        // -------------------------------------------------
        // 3. Find recipient account
        // -------------------------------------------------

        const [recipientAccounts] = await connection.query(
            `SELECT id, account_number, balance
             FROM accounts
             WHERE account_number = ?
             FOR UPDATE`,
            [recipient_account]
        );

        if (recipientAccounts.length === 0) {
            await connection.rollback();
            connection.release();

            return res.status(404).json({
                success: false,
                message: "Recipient account not found"
            });
        }

        const recipientAccount = recipientAccounts[0];

        // -------------------------------------------------
        // 4. Check sender balance
        // -------------------------------------------------

        if (
            Number(senderAccount.balance) <
            Number(amount)
        ) {
            await connection.rollback();
            connection.release();

            return res.status(400).json({
                success: false,
                message: "Insufficient account balance"
            });
        }

        // -------------------------------------------------
        // 5. Calculate new balances
        // -------------------------------------------------

        const senderNewBalance =
            Number(senderAccount.balance) -
            Number(amount);

        const recipientNewBalance =
            Number(recipientAccount.balance) +
            Number(amount);

        // -------------------------------------------------
        // 6. Update sender
        // -------------------------------------------------

        await connection.query(
            `UPDATE accounts
             SET balance = ?
             WHERE id = ?`,
            [
                senderNewBalance,
                senderAccount.id
            ]
        );

        // -------------------------------------------------
        // 7. Update recipient
        // -------------------------------------------------

        await connection.query(
            `UPDATE accounts
             SET balance = ?
             WHERE id = ?`,
            [
                recipientNewBalance,
                recipientAccount.id
            ]
        );

        // -------------------------------------------------
        // 8. Create sender transaction
        // -------------------------------------------------

        await connection.query(
            `INSERT INTO transactions
            (
                account_id,
                transaction_type,
                amount,
                recipient_account,
                description,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                senderAccount.id,
                "transfer",
                amount,
                recipient_account,
                description || "Money transfer",
                "SUCCESS"
            ]
        );

        // -------------------------------------------------
        // 9. Create recipient transaction
        // -------------------------------------------------

        await connection.query(
            `INSERT INTO transactions
            (
                account_id,
                transaction_type,
                amount,
                description,
                status
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                recipientAccount.id,
                "deposit",
                amount,
                `Transfer received from ${senderAccount.account_number}`,
                "SUCCESS"
            ]
        );

        // -------------------------------------------------
        // 10. Commit transaction
        // -------------------------------------------------

        await connection.commit();

        connection.release();

        res.status(200).json({
            success: true,
            message: "Money transferred successfully",
            transfer: {
                from_account: senderAccount.account_number,
                to_account: recipientAccount.account_number,
                amount: amount,
                sender_balance: senderNewBalance
            }
        });

    } catch (error) {

        await connection.rollback();
        connection.release();

        console.error(
            "Transfer error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error during transfer"
        });
    }
};

module.exports = {
    createAccount,
    getAccount,
    depositMoney,
    withdrawMoney,
    transferMoney
};