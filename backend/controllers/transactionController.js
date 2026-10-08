const db = require("../config/db");

const {
    analyzeTransaction
} = require("../services/fraudService");


// =====================================================
// GET ALL TRANSACTIONS
// =====================================================

const getTransactions = async (req, res) => {

    try {

        const userId =
            req.user.id;


        // =================================================
        // FIND USER ACCOUNT
        // =================================================

        const [accounts] =
            await db.query(
                `
                SELECT
                    id,
                    account_number,
                    balance
                FROM accounts
                WHERE user_id = ?
                LIMIT 1
                `,
                [userId]
            );


        if (
            accounts.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Bank account not found"

            });

        }


        const accountId =
            accounts[0].id;


        // =================================================
        // GET TRANSACTIONS
        // =================================================

        const [transactions] =
            await db.query(
                `
                SELECT
                    id,
                    transaction_type,
                    amount,
                    recipient_account,
                    description,
                    status,
                    fraud_score,
                    created_at
                FROM transactions
                WHERE account_id = ?
                ORDER BY created_at DESC
                `,
                [accountId]
            );


        // =================================================
        // FORMAT TRANSACTIONS
        // =================================================

        const formattedTransactions =
            transactions.map(
                transaction => {

                    const fraudProbability =
                        transaction.fraud_score !== null &&
                        transaction.fraud_score !== undefined
                            ? Number(
                                transaction.fraud_score
                            )
                            : 0;


                    let riskLevel =
                        "LOW";


                    if (
                        transaction.status ===
                        "blocked"
                    ) {

                        riskLevel =
                            "HIGH";

                    } else if (
                        fraudProbability >=
                        0.80
                    ) {

                        riskLevel =
                            "HIGH";

                    } else if (
                        fraudProbability >=
                        0.40
                    ) {

                        riskLevel =
                            "MEDIUM";

                    }


                    return {

                        ...transaction,

                        fraud_probability:
                            fraudProbability,

                        risk_level:
                            riskLevel

                    };

                }
            );


        // =================================================
        // RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            account_number:
                accounts[0].account_number,

            balance:
                accounts[0].balance,

            transactions:
                formattedTransactions

        });


    } catch (error) {

        console.error(
            "Get transactions error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load transactions"

        });

    }

};


// =====================================================
// CREATE TRANSACTION
// =====================================================

const createTransaction = async (
    req,
    res
) => {

    const connection =
        await db.getConnection();


    try {

        const userId =
            req.user.id;


        const {
            transaction_type,
            amount,
            description,
            recipient_account
        } = req.body;


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !transaction_type ||
            amount === undefined ||
            amount === null ||
            amount === ""
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Transaction type and amount are required"

            });

        }


        const numericAmount =
            Number(amount);


        if (
            !Number.isFinite(
                numericAmount
            ) ||
            numericAmount <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Amount must be greater than zero"

            });

        }


        const allowedTypes = [
            "deposit",
            "withdrawal",
            "transfer"
        ];


        if (
            !allowedTypes.includes(
                transaction_type
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid transaction type"

            });

        }


        // =================================================
        // FIND USER ACCOUNT
        // =================================================

        const [accounts] =
            await connection.query(
                `
                SELECT
                    id,
                    account_number,
                    balance
                FROM accounts
                WHERE user_id = ?
                LIMIT 1
                `,
                [userId]
            );


        if (
            accounts.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Bank account not found"

            });

        }


        const account =
            accounts[0];


        const currentBalance =
            Number(
                account.balance
            );


        // =================================================
        // BALANCE CHECK
        // =================================================

        if (
            (
                transaction_type ===
                "withdrawal" ||

                transaction_type ===
                "transfer"
            ) &&
            currentBalance <
            numericAmount
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Insufficient account balance"

            });

        }


        // =================================================
        // AI FRAUD ANALYSIS
        // =================================================

        console.log(
            "----------------------------------------"
        );

        console.log(
            `Sending ₹${numericAmount} transaction to AI fraud detection...`
        );


        const aiResult =
            await analyzeTransaction(
                numericAmount
            );


        const prediction =
            aiResult.prediction ||
            {};


        const fraudProbability =
            Number(
                prediction.fraud_probability ||
                0
            );


        const isFraud =
            Boolean(
                prediction.is_fraud ||
                false
            );


        const aiRiskLevel =
            (
                prediction.risk_level ||
                "LOW"
            ).toUpperCase();


        const amountRisk =
            Number(
                prediction.transaction_amount_risk ||
                0
            );


        const reason =
            prediction.reason ||
            "Transaction analyzed by AI fraud detection.";


        console.log(
            "AI probability:",
            fraudProbability
        );

        console.log(
            "AI risk level:",
            aiRiskLevel
        );

        console.log(
            "Amount risk:",
            amountRisk
        );

        console.log(
            "Is fraud:",
            isFraud
        );

        console.log(
            "----------------------------------------"
        );


        // =================================================
        // TRANSACTION DECISION
        //
        // < 40%
        //     COMPLETE
        //
        // 40% - 79.99%
        //     USER CONFIRMATION
        //
        // >= 80%
        //     BLOCK
        // =================================================

        let transactionStatus =
            "completed";


        let confirmationRequired =
            false;


        if (
            aiRiskLevel === "HIGH" ||
            fraudProbability >= 0.80 ||
            isFraud === true
        ) {

            transactionStatus =
                "blocked";

        } else if (
            fraudProbability >= 0.40
        ) {

            transactionStatus =
                "pending";

            confirmationRequired =
                true;

        } else {

            transactionStatus =
                "completed";

        }


        // =================================================
        // HIGH-RISK TRANSACTION
        // IMMEDIATE BLOCK
        // =================================================

        if (
            transactionStatus ===
            "blocked"
        ) {

            const [result] =
                await connection.query(
                    `
                    INSERT INTO transactions
                    (
                        account_id,
                        transaction_type,
                        amount,
                        recipient_account,
                        description,
                        status,
                        fraud_score
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        account.id,

                        transaction_type,

                        numericAmount,

                        recipient_account ||
                        null,

                        description ||
                        null,

                        "blocked",

                        fraudProbability
                    ]
                );


            return res.status(201).json({

                success: true,

                transactionBlocked:
                    true,

                confirmationRequired:
                    false,

                message:
                    "Transaction blocked due to unusual activity.",

                transaction: {

                    id:
                        result.insertId,

                    transaction_type:
                        transaction_type,

                    amount:
                        numericAmount,

                    description:
                        description ||
                        null,

                    recipient_account:
                        recipient_account ||
                        null,

                    status:
                        "blocked",

                    fraud_probability:
                        fraudProbability,

                    risk_level:
                        "HIGH"

                },

                ai_analysis: {

                    fraud_probability:
                        fraudProbability,

                    is_fraud:
                        true,

                    risk_level:
                        "HIGH",

                    xgboost_probability:
                        Number(
                            prediction.xgboost_probability ||
                            0
                        ),

                    transaction_amount_risk:
                        amountRisk,

                    amount_risk_level:
                        prediction.amount_risk_level ||
                        "HIGH",

                    reason:
                        reason

                }

            });

        }


        // =================================================
        // MEDIUM-RISK TRANSACTION
        // REQUIRE USER CONFIRMATION
        // =================================================

        if (
            confirmationRequired ===
            true
        ) {

            const [result] =
                await connection.query(
                    `
                    INSERT INTO transactions
                    (
                        account_id,
                        transaction_type,
                        amount,
                        recipient_account,
                        description,
                        status,
                        fraud_score
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        account.id,

                        transaction_type,

                        numericAmount,

                        recipient_account ||
                        null,

                        description ||
                        null,

                        "pending",

                        fraudProbability
                    ]
                );


            return res.status(201).json({

                success: true,

                transactionBlocked:
                    false,

                confirmationRequired:
                    true,

                message:
                    "Unusual transaction detected. Please confirm whether you made this transaction.",

                transaction: {

                    id:
                        result.insertId,

                    transaction_type:
                        transaction_type,

                    amount:
                        numericAmount,

                    description:
                        description ||
                        null,

                    recipient_account:
                        recipient_account ||
                        null,

                    status:
                        "pending",

                    fraud_probability:
                        fraudProbability,

                    risk_level:
                        "MEDIUM"

                },

                ai_analysis: {

                    fraud_probability:
                        fraudProbability,

                    is_fraud:
                        false,

                    risk_level:
                        "MEDIUM",

                    xgboost_probability:
                        Number(
                            prediction.xgboost_probability ||
                            0
                        ),

                    transaction_amount_risk:
                        amountRisk,

                    amount_risk_level:
                        prediction.amount_risk_level ||
                        "MEDIUM",

                    reason:
                        reason

                }

            });

        }


        // =================================================
        // LOW-RISK TRANSACTION
        // COMPLETE IMMEDIATELY
        // =================================================

        await connection.beginTransaction();


        let newBalance =
            currentBalance;


        if (
            transaction_type ===
            "deposit"
        ) {

            newBalance +=
                numericAmount;

        } else {

            newBalance -=
                numericAmount;

        }


        // =================================================
        // UPDATE ACCOUNT
        // =================================================

        await connection.query(
            `
            UPDATE accounts
            SET balance = ?
            WHERE id = ?
            `,
            [
                newBalance,
                account.id
            ]
        );


        // =================================================
        // INSERT TRANSACTION
        // =================================================

        const [result] =
            await connection.query(
                `
                INSERT INTO transactions
                (
                    account_id,
                    transaction_type,
                    amount,
                    recipient_account,
                    description,
                    status,
                    fraud_score
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    account.id,

                    transaction_type,

                    numericAmount,

                    recipient_account ||
                    null,

                    description ||
                    null,

                    "completed",

                    fraudProbability
                ]
            );


        await connection.commit();


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(201).json({

            success: true,

            transactionBlocked:
                false,

            confirmationRequired:
                false,

            message:
                "Transaction completed successfully.",

            transaction: {

                id:
                    result.insertId,

                transaction_type:
                    transaction_type,

                amount:
                    numericAmount,

                description:
                    description ||
                    null,

                recipient_account:
                    recipient_account ||
                    null,

                status:
                    "completed",

                fraud_probability:
                    fraudProbability,

                risk_level:
                    "LOW"

            },

            account: {

                account_number:
                    account.account_number,

                balance:
                    newBalance

            },

            ai_analysis: {

                fraud_probability:
                    fraudProbability,

                is_fraud:
                    false,

                risk_level:
                    "LOW",

                xgboost_probability:
                    Number(
                        prediction.xgboost_probability ||
                        0
                    ),

                transaction_amount_risk:
                    amountRisk,

                amount_risk_level:
                    prediction.amount_risk_level ||
                    "LOW",

                reason:
                    reason

            }

        });


    } catch (error) {

        try {

            await connection.rollback();

        } catch (
            rollbackError
        ) {

            console.error(
                "Rollback error:",
                rollbackError
            );

        }


        console.error(
            "Create transaction error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Transaction failed",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined

        });


    } finally {

        connection.release();

    }

};


// =====================================================
// CONFIRM / ALLOW PENDING TRANSACTION
// =====================================================

const confirmTransaction = async (
    req,
    res
) => {

    const connection =
        await db.getConnection();


    try {

        const userId =
            req.user.id;


        const transactionId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(
                transactionId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid transaction ID"

            });

        }


        await connection.beginTransaction();


        // =================================================
        // FIND AND LOCK TRANSACTION
        // =================================================

        const [transactions] =
            await connection.query(
                `
                SELECT
                    t.id,
                    t.account_id,
                    t.transaction_type,
                    t.amount,
                    t.recipient_account,
                    t.description,
                    t.status,
                    t.fraud_score,
                    a.account_number,
                    a.balance
                FROM transactions t
                INNER JOIN accounts a
                    ON t.account_id = a.id
                WHERE
                    t.id = ?
                    AND a.user_id = ?
                LIMIT 1
                FOR UPDATE
                `,
                [
                    transactionId,
                    userId
                ]
            );


        if (
            transactions.length === 0
        ) {

            await connection.rollback();


            return res.status(404).json({

                success: false,

                message:
                    "Transaction not found"

            });

        }


        const transaction =
            transactions[0];


        // =================================================
        // CHECK STATUS
        // =================================================

        if (
            transaction.status !==
            "pending"
        ) {

            await connection.rollback();


            return res.status(400).json({

                success: false,

                message:
                    `This transaction is already ${transaction.status}.`

            });

        }


        const amount =
            Number(
                transaction.amount
            );


        let currentBalance =
            Number(
                transaction.balance
            );


        // =================================================
        // BALANCE CHECK
        // =================================================

        if (
            (
                transaction.transaction_type ===
                "withdrawal" ||

                transaction.transaction_type ===
                "transfer"
            ) &&
            currentBalance <
            amount
        ) {

            await connection.rollback();


            return res.status(400).json({

                success: false,

                message:
                    "Insufficient account balance"

            });

        }


        // =================================================
        // CALCULATE BALANCE
        // =================================================

        let newBalance =
            currentBalance;


        if (
            transaction.transaction_type ===
            "deposit"
        ) {

            newBalance +=
                amount;

        } else {

            newBalance -=
                amount;

        }


        // =================================================
        // UPDATE ACCOUNT
        // =================================================

        await connection.query(
            `
            UPDATE accounts
            SET balance = ?
            WHERE id = ?
            `,
            [
                newBalance,
                transaction.account_id
            ]
        );


        // =================================================
        // COMPLETE TRANSACTION
        // =================================================

        await connection.query(
            `
            UPDATE transactions
            SET status = 'completed'
            WHERE id = ?
            `,
            [
                transactionId
            ]
        );


        await connection.commit();


        return res.status(200).json({

            success: true,

            message:
                "Transaction approved and completed successfully.",

            transaction: {

                id:
                    transaction.id,

                transaction_type:
                    transaction.transaction_type,

                amount:
                    amount,

                description:
                    transaction.description,

                recipient_account:
                    transaction.recipient_account,

                status:
                    "completed",

                fraud_probability:
                    Number(
                        transaction.fraud_score ||
                        0
                    ),

                risk_level:
                    "MEDIUM"

            },

            account: {

                account_number:
                    transaction.account_number,

                balance:
                    newBalance

            }

        });


    } catch (error) {

        try {

            await connection.rollback();

        } catch (
            rollbackError
        ) {

            console.error(
                "Rollback error:",
                rollbackError
            );

        }


        console.error(
            "Confirm transaction error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to confirm transaction",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined

        });


    } finally {

        connection.release();

    }

};


// =====================================================
// BLOCK / CANCEL PENDING TRANSACTION
// =====================================================

const blockTransaction = async (
    req,
    res
) => {

    const connection =
        await db.getConnection();


    try {

        const userId =
            req.user.id;


        const transactionId =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(
                transactionId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid transaction ID"

            });

        }


        // =================================================
        // FIND TRANSACTION
        // =================================================

        const [transactions] =
            await connection.query(
                `
                SELECT
                    t.id,
                    t.status
                FROM transactions t
                INNER JOIN accounts a
                    ON t.account_id = a.id
                WHERE
                    t.id = ?
                    AND a.user_id = ?
                LIMIT 1
                `,
                [
                    transactionId,
                    userId
                ]
            );


        if (
            transactions.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Transaction not found"

            });

        }


        // =================================================
        // CHECK STATUS
        // =================================================

        if (
            transactions[0].status !==
            "pending"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `This transaction is already ${transactions[0].status}.`

            });

        }


        // =================================================
        // BLOCK
        // =================================================

        await connection.query(
            `
            UPDATE transactions
            SET status = 'blocked'
            WHERE id = ?
            `,
            [
                transactionId
            ]
        );


        return res.status(200).json({

            success: true,

            transactionBlocked:
                true,

            message:
                "Transaction blocked due to unusual activity."

        });


    } catch (error) {

        console.error(
            "Block transaction error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to block transaction"

        });


    } finally {

        connection.release();

    }

};


// =====================================================
// TEST AI FRAUD DETECTION
// =====================================================

const testFraudDetection = async (
    req,
    res
) => {

    try {

        const {
            amount
        } = req.body;


        const numericAmount =
            Number(amount);


        if (
            !Number.isFinite(
                numericAmount
            ) ||
            numericAmount <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide a valid amount"

            });

        }


        console.log(
            `Testing AI fraud detection for ₹${numericAmount}`
        );


        const aiResult =
            await analyzeTransaction(
                numericAmount
            );


        const prediction =
            aiResult.prediction ||
            {};


        return res.status(200).json({

            success:
                aiResult.success !==
                false,

            message:
                "AI fraud analysis completed",

            amount:
                numericAmount,

            ai_analysis: {

                fraud_probability:
                    Number(
                        prediction.fraud_probability ||
                        0
                    ),

                is_fraud:
                    Boolean(
                        prediction.is_fraud ||
                        false
                    ),

                risk_level:
                    prediction.risk_level ||
                    "LOW",

                xgboost_probability:
                    Number(
                        prediction.xgboost_probability ||
                        0
                    ),

                transaction_amount_risk:
                    Number(
                        prediction.transaction_amount_risk ||
                        0
                    ),

                amount_risk_level:
                    prediction.amount_risk_level ||
                    "LOW",

                reason:
                    prediction.reason ||
                    "No additional risk information."

            }

        });


    } catch (error) {

        console.error(
            "Fraud test error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "AI fraud detection test failed",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined

        });

    }

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getTransactions,

    createTransaction,

    confirmTransaction,

    blockTransaction,

    testFraudDetection

};