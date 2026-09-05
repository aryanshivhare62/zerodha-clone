const pool = require("../config/db");

const getTransactions = async (req, res) => {
    try{
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT 
                id,
                type,
                amount,
                description,
                created_at
             FROM transactions
             WHERE user_id = $1
             ORDER BY created_at DESC`,
             [userId]
        );

        res.status(200).json({
            transactions: result.rows
        });

    }catch (error) {
        console.log(error);

        res.status(500).json({
            message: "server error"
        });
    }
};

module.exports = {
    getTransactions
}