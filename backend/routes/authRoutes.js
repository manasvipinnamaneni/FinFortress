const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../config/db");

const router = express.Router();


/* =========================================================
   GENERATE UNIQUE ACCOUNT NUMBER
========================================================= */

const generateAccountNumber = async (connection) => {

    while (true) {

        const accountNumber =
            String(
                Math.floor(
                    100000000000 +
                    Math.random() * 900000000000
                )
            );


        const [existing] =
            await connection.query(
                `
                SELECT id
                FROM accounts
                WHERE account_number = ?
                LIMIT 1
                `,
                [accountNumber]
            );


        if (existing.length === 0) {

            return accountNumber;

        }

    }

};


/* =========================================================
   REGISTER
========================================================= */

router.post(
    "/register",
    async (req, res) => {

        let connection;


        try {

            console.log(
                "========================================"
            );

            console.log(
                "REGISTRATION REQUEST RECEIVED"
            );

            console.log(
                req.body
            );


            /* =================================================
               GET FORM DATA
            ================================================= */

            const {
                full_name,
                email,
                phone,
                password
            } = req.body;


            /* =================================================
               BASIC VALIDATION
            ================================================= */

            if (
                !full_name ||
                !email ||
                !phone ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "All fields are required."

                });

            }


            const cleanName =
                String(full_name).trim();


            const cleanEmail =
                String(email)
                    .trim()
                    .toLowerCase();


            const cleanPhone =
                String(phone).trim();


            const cleanPassword =
                String(password);


            /* =================================================
               NAME VALIDATION
            ================================================= */

            if (
                cleanName.length < 3
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Full name must contain at least 3 characters."

                });

            }


            /* =================================================
               EMAIL VALIDATION
            ================================================= */

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (
                !emailPattern.test(
                    cleanEmail
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid email address."

                });

            }


            /* =================================================
               PHONE VALIDATION
            ================================================= */

            if (
                !/^[0-9]{10}$/.test(
                    cleanPhone
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Phone number must contain exactly 10 digits."

                });

            }


            /* =================================================
               PASSWORD VALIDATION
            ================================================= */

            if (
                cleanPassword.length < 6
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password must contain at least 6 characters."

                });

            }


            /* =================================================
               GET DATABASE CONNECTION
            ================================================= */

            connection =
                await db.getConnection();


            /* =================================================
               CHECK EXISTING EMAIL
            ================================================= */

            const [existingUsers] =
                await connection.query(
                    `
                    SELECT
                        id
                    FROM users
                    WHERE email = ?
                    LIMIT 1
                    `,
                    [cleanEmail]
                );


            if (
                existingUsers.length > 0
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "An account with this email already exists. Please login."

                });

            }


            /* =================================================
               CHECK EXISTING PHONE
            ================================================= */

            const [existingPhones] =
                await connection.query(
                    `
                    SELECT
                        id
                    FROM users
                    WHERE phone = ?
                    LIMIT 1
                    `,
                    [cleanPhone]
                );


            if (
                existingPhones.length > 0
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "An account with this phone number already exists."

                });

            }


            /* =================================================
               HASH PASSWORD
            ================================================= */

            const hashedPassword =
                await bcrypt.hash(
                    cleanPassword,
                    10
                );


            console.log(
                "Password hashed successfully."
            );


            /* =================================================
               START DATABASE TRANSACTION
            ================================================= */

            await connection.beginTransaction();


            /* =================================================
               INSERT USER
            ================================================= */

            const [userResult] =
                await connection.query(
                    `
                    INSERT INTO users
                    (
                        full_name,
                        email,
                        phone,
                        password
                    )
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        cleanName,
                        cleanEmail,
                        cleanPhone,
                        hashedPassword
                    ]
                );


            const userId =
                userResult.insertId;


            console.log(
                "User created successfully:",
                userId
            );


            /* =================================================
               GENERATE ACCOUNT NUMBER
            ================================================= */

            const accountNumber =
                await generateAccountNumber(
                    connection
                );


            console.log(
                "Account number generated:",
                accountNumber
            );


            /* =================================================
               CREATE BANK ACCOUNT
               
               IMPORTANT:
               Your actual accounts table contains ONLY:
               
               id
               user_id
               account_number
               account_type
               balance
               created_at
               
               Therefore we do NOT insert:
               currency
               status
            ================================================= */

            await connection.query(
                `
                INSERT INTO accounts
                (
                    user_id,
                    account_number,
                    account_type,
                    balance
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    userId,
                    accountNumber,
                    "savings",
                    0.00
                ]
            );


            console.log(
                "Bank account created successfully."
            );


            /* =================================================
               COMMIT BOTH OPERATIONS
            ================================================= */

            await connection.commit();


            /* =================================================
               GET CREATED USER
            ================================================= */

            const [users] =
                await connection.query(
                    `
                    SELECT
                        id,
                        full_name,
                        email,
                        phone,
                        role
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [userId]
                );


            const user =
                users[0];


            /* =================================================
               SUCCESS RESPONSE
               
               IMPORTANT:
               NO JWT IS CREATED HERE.
               
               User must login after registration.
            ================================================= */

            console.log(
                "Registration completed successfully."
            );

            console.log(
                "========================================"
            );


            return res.status(201).json({

                success: true,

                message:
                    "Account created successfully. Please login.",

                user: user,

                bank_account: {

                    account_number:
                        accountNumber,

                    account_type:
                        "savings",

                    balance:
                        0.00

                }

            });


        } catch (error) {

            console.error(
                "========================================"
            );

            console.error(
                "REGISTRATION ERROR"
            );

            console.error(
                error
            );

            console.error(
                "========================================"
            );


            /* =================================================
               ROLLBACK
            ================================================= */

            if (connection) {

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

            }


            /* =================================================
               DUPLICATE ENTRY
            ================================================= */

            if (
                error.code ===
                "ER_DUP_ENTRY"
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Email, phone number, or account number already exists."

                });

            }


            /* =================================================
               DATABASE ERROR
            ================================================= */

            return res.status(500).json({

                success: false,

                message:
                    "Registration failed.",

                error:
                    error.sqlMessage ||
                    error.message

            });


        } finally {

            if (connection) {

                connection.release();

            }

        }

    }
);


/* =========================================================
   LOGIN
========================================================= */

router.post(
    "/login",
    async (req, res) => {

        try {

            console.log(
                "========================================"
            );

            console.log(
                "LOGIN REQUEST RECEIVED"
            );


            const {
                email,
                password
            } = req.body;


            /* =================================================
               VALIDATION
            ================================================= */

            if (
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email and password are required."

                });

            }


            const cleanEmail =
                String(email)
                    .trim()
                    .toLowerCase();


            /* =================================================
               FIND USER
            ================================================= */

            const [users] =
                await db.query(
                    `
                    SELECT
                        id,
                        full_name,
                        email,
                        phone,
                        password,
                        role
                    FROM users
                    WHERE email = ?
                    LIMIT 1
                    `,
                    [cleanEmail]
                );


            if (
                users.length === 0
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password."

                });

            }


            const user =
                users[0];


            /* =================================================
               VERIFY PASSWORD
            ================================================= */

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );


            if (!passwordMatch) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password."

                });

            }


            /* =================================================
               GENERATE JWT
            ================================================= */

            const token =
                jwt.sign(

                    {
                        id:
                            user.id,

                        email:
                            user.email,

                        role:
                            user.role

                    },

                    process.env.JWT_SECRET,

                    {
                        expiresIn:
                            "1d"
                    }

                );


            /* =================================================
               REMOVE PASSWORD
            ================================================= */

            delete user.password;


            /* =================================================
               GET BANK ACCOUNT
            ================================================= */

            const [accounts] =
                await db.query(
                    `
                    SELECT
                        id,
                        account_number,
                        account_type,
                        balance,
                        created_at
                    FROM accounts
                    WHERE user_id = ?
                    LIMIT 1
                    `,
                    [user.id]
                );


            /* =================================================
               LOGIN SUCCESS
            ================================================= */

            console.log(
                "Login successful for:",
                user.email
            );

            console.log(
                "========================================"
            );


            return res.status(200).json({

                success: true,

                message:
                    "Login successful.",

                token:
                    token,

                user:
                    user,

                account:
                    accounts.length > 0
                        ? accounts[0]
                        : null

            });


        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Login failed.",

                error:
                    error.sqlMessage ||
                    error.message

            });

        }

    }
);


module.exports = router;