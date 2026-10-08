const express = require("express");

const router = express.Router();

const db = require("../config/db");

const authenticateToken =
    require("../middleware/authMiddleware");


/* =========================================================
   GET CURRENT USER PROFILE
   GET /api/users/profile
========================================================= */

router.get(
    "/profile",
    authenticateToken,
    async (req, res) => {

        try {

            const userId =
                req.user.id;


            console.log(
                "Loading profile for user:",
                userId
            );


            /* =================================================
               GET USER
            ================================================= */

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
                        "User profile not found."

                });

            }


            const user =
                users[0];


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
                    [userId]
                );


            const account =
                accounts.length > 0
                    ? accounts[0]
                    : null;


            /* =================================================
               RESPONSE
            ================================================= */

            return res.status(200).json({

                success: true,

                message:
                    "Profile loaded successfully.",

                data: {

                    user: user,

                    account: account

                }

            });


        } catch (error) {

            console.error(
                "Get profile error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load profile.",

                error:
                    error.message

            });

        }

    }
);


module.exports = router;