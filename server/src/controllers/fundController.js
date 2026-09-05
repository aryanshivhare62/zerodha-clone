const pool = require("../config/db");

const getFunds = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT
                id,
                user_id,
                available_balance,
                used_balance,
                updated_at
             FROM funds
             WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Funds account not found"
            });
        }

        res.status(200).json({
            funds: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const depositFunds = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.userId;

        if(!amount || amount <= 0){
            return res.status(400).json({
                message: "Amount should be greater than 0"
            });
        }

        const result = await pool.query(
            `UPDATE funds
             SET available_balance = available_balance + $1,
                updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2
             RETURNING *`,
            [amount, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Funds account not found"
            });
        }

        // Record transaction
        await pool.query(
            `INSERT INTO transactions
             (user_id, type, amount, description)
             VALUES ($1, $2, $3, $4)`,
            [
                userId,
                "DEPOSIT",
                amount,
                "Funds deposited"
            ]
        );

        res.status(200).json({
            message: "Funds added successfully",
            funds: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const withdrawFunds = async (req, res) => {
    try {
        const { amount } = req.body;
        const userId = req.user.userId;

        if(!amount || amount <= 0){
            return res.status(400).json({
                message: "Amount should be greater than 0"
            });
        }

        const result = await pool.query(
            `UPDATE funds
             SET available_balance = available_balance - $1,
                updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2
             AND available_balance >= $1
             RETURNING *`,
            [amount, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Insufficient funds"
            });
        }

        // Record transaction
        await pool.query(
            `INSERT INTO transactions
             (user_id, type, amount, description)
             VALUES ($1, $2, $3, $4)`,
            [
                userId,
                "WITHDRAW",
                amount,
                "Funds withdrawn"
            ]
        );

        res.status(200).json({
            message: "Funds withdrawn successfully",
            funds: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    getFunds,
    depositFunds,
    withdrawFunds
};