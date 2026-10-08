const db = require("../config/db");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");


// =====================================================
// REGISTER
// =====================================================

const register = async (req, res) => {

    try {

        const {
            full_name,
            email,
            phone,
            password
        } = req.body;


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !full_name ||
            !email ||
            !phone ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "All fields are required"

            });

        }


        if (password.length < 6) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must contain at least 6 characters"

            });

        }


        // =================================================
        // CHECK EXISTING USER
        // =================================================

        const [existingUsers] =
            await db.query(

                `
                SELECT
                    id
                FROM users
                WHERE email = ?
                LIMIT 1
                `,

                [email]

            );


        if (
            existingUsers.length > 0
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Email already registered"

            });

        }


        // =================================================
        // HASH PASSWORD
        // =================================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // =================================================
        // CREATE USER
        // =================================================

        const [result] =
            await db.query(

                `
                INSERT INTO users
                (
                    full_name,
                    email,
                    phone,
                    password,
                    role
                )
                VALUES (?, ?, ?, ?, ?)
                `,

                [
                    full_name,
                    email,
                    phone,
                    hashedPassword,
                    "customer"
                ]

            );


        // =================================================
        // CREATE ACCOUNT
        // =================================================

        const accountNumber =
            generateAccountNumber();


        await db.query(

            `
            INSERT INTO accounts
            (
                user_id,
                account_number,
                account_type,
                balance,
                status
            )
            VALUES (?, ?, ?, ?, ?)
            `,

            [
                result.insertId,
                accountNumber,
                "savings",
                0,
                "active"
            ]

        );


        // =================================================
        // RESPONSE
        // =================================================

        res.status(201).json({

            success: true,

            message:
                "Registration successful",

            user: {

                id:
                    result.insertId,

                full_name,

                email,

                phone,

                role:
                    "customer"

            },

            account: {

                account_number:
                    accountNumber,

                account_type:
                    "savings",

                balance:
                    0,

                status:
                    "active"

            }

        });


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Registration failed",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined

        });

    }

};


// =====================================================
// LOGIN
// =====================================================

const login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (
            !email ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required"

            });

        }


        // =================================================
        // FIND USER
        // =================================================

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

                [email]

            );


        if (
            users.length === 0
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"

            });

        }


        const user =
            users[0];


        // =================================================
        // CHECK PASSWORD
        // =================================================

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"

            });

        }


        // =================================================
        // CREATE JWT
        // =================================================

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
                        "24h"
                }

            );


        // =================================================
        // RESPONSE
        // =================================================

        res.status(200).json({

            success: true,

            message:
                "Login successful",

            token,

            user: {

                id:
                    user.id,

                full_name:
                    user.full_name,

                email:
                    user.email,

                phone:
                    user.phone,

                role:
                    user.role

            }

        });


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Login failed",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined

        });

    }

};


// =====================================================
// GET PROFILE
// =====================================================

const getProfile = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.id;


        const [users] =
            await db.query(

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


        if (
            users.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found"

            });

        }


        res.status(200).json({

            success: true,

            user:
                users[0]

        });


    } catch (error) {

        console.error(
            "Get profile error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to load profile"

        });

    }

};


// =====================================================
// CHANGE PASSWORD
// =====================================================

const changePassword = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.id;


        const {
            currentPassword,
            newPassword
        } = req.body;


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !currentPassword ||
            !newPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Current password and new password are required"

            });

        }


        if (
            newPassword.length < 6
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must contain at least 6 characters"

            });

        }


        if (
            currentPassword ===
            newPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be different from current password"

            });

        }


        // =================================================
        // GET CURRENT PASSWORD
        // =================================================

        const [users] =
            await db.query(

                `
                SELECT
                    id,
                    password
                FROM users
                WHERE id = ?
                LIMIT 1
                `,

                [userId]

            );


        if (
            users.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "User not found"

            });

        }


        const user =
            users[0];


        // =================================================
        // VERIFY CURRENT PASSWORD
        // =================================================

        const passwordMatch =
            await bcrypt.compare(

                currentPassword,

                user.password

            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Current password is incorrect"

            });

        }


        // =================================================
        // HASH NEW PASSWORD
        // =================================================

        const hashedPassword =
            await bcrypt.hash(

                newPassword,

                10

            );


        // =================================================
        // UPDATE PASSWORD
        // =================================================

        await db.query(

            `
            UPDATE users
            SET password = ?
            WHERE id = ?
            `,

            [
                hashedPassword,
                userId
            ]

        );


        // =================================================
        // RESPONSE
        // =================================================

        res.status(200).json({

            success: true,

            message:
                "Password changed successfully"

        });


    } catch (error) {

        console.error(
            "Change password error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to change password",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined

        });

    }

};


// =====================================================
// GENERATE ACCOUNT NUMBER
// =====================================================

const generateAccountNumber = () => {

    const prefix =
        "660864";

    const randomNumber =
        Math.floor(
            100000 +
            Math.random() * 900000
        );

    return (
        prefix +
        randomNumber
    );

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    register,

    login,

    getProfile,

    changePassword

};