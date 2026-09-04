const pool = require("../config/db");

const getHoldings = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT
                h.id,
                h.stock_id,
                s.symbol,
                s.company_name,
                s.exchange,
                h.quantity,
                h.average_price,
                h.updated_at
             FROM holdings h
             JOIN stocks s
             ON h.stock_id = s.id
             WHERE h.user_id = $1
             ORDER BY h.id ASC`,
            [userId]
        );

        res.status(200).json({
            holdings: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getHoldingById = async (req, res) => {
    try {
        const { holdingId } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT
                h.id,
                h.stock_id,
                s.symbol,
                s.company_name,
                s.exchange,
                h.quantity,
                h.average_price,
                h.updated_at
             FROM holdings h
             JOIN stocks s
             ON h.stock_id = s.id
             WHERE h.id = $1
             AND h.user_id = $2`,
            [holdingId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Holding not found"
            });
        }

        return res.status(200).json({
            holding: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};



module.exports = {
    getHoldings,
    getHoldingById
};