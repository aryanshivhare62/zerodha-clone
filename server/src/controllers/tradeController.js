const pool = require("../config/db");

const executeTrade = async (req, res) => {
    try {
        const { order_id } = req.body;
        const userId = req.user.userId;

        if (!order_id) {
            return res.status(400).json({
                message: "order_id is required"
            });
        }

        // 1. Get pending order
        const orderResult = await pool.query(
            `SELECT *
             FROM orders
             WHERE id = $1
             AND user_id = $2
             AND status = 'PENDING'`,
            [order_id, userId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                message: "Pending order not found"
            });
        }

        const order = orderResult.rows[0];

        // 2. Create trade
        const tradeResult = await pool.query(
            `INSERT INTO trades
             (order_id, user_id, stock_id, quantity, price)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                order.id,
                order.user_id,
                order.stock_id,
                order.quantity,
                order.price
            ]
        );

        // 3. Mark order as completed
        await pool.query(
            `UPDATE orders
             SET status = 'COMPLETED'
             WHERE id = $1`,
            [order.id]
        );

        res.status(201).json({
            message: "Trade executed successfully",
            trade: tradeResult.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getTrades = async (req, res) => {
    try{
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT
                t.id,
                t.order_id,
                t.stock_id,
                s.symbol,
                s.company_name,
                s.exchange,
                t.quantity,
                t.price,
                t.executed_at
             FROM trades t
             JOIN stocks s
             ON t.stock_id = s.id
             WHERE t.user_id = $1
             ORDER BY t.executed_at DESC`,
            [userId]
        );

        res.status(200).json({
            trades: result.rows
        })

    }catch (error) {
        console.log(error);

        res.status(500).json({
            message: "server error"
        });
    }
};

const getTradeById = async (req, res) => {
    try {
        const { tradeId } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT
                t.id,
                t.order_id,
                t.stock_id,
                s.symbol,
                s.company_name,
                s.exchange,
                t.quantity,
                t.price,
                t.executed_at
             FROM trades t
             JOIN stocks s
             ON t.stock_id = s.id
             WHERE t.id = $1
             AND t.user_id = $2`,
            [tradeId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Trade not found"
            });
        }

        res.status(200).json({
            trade: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getTradesByStock = async (req, res) => {
    try {
        const { stockId } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT
                t.id,
                t.order_id,
                t.stock_id,
                s.symbol,
                s.company_name,
                s.exchange,
                t.quantity,
                t.price,
                t.executed_at
             FROM trades t
             JOIN stocks s
             ON t.stock_id = s.id
             WHERE t.stock_id = $1
             AND t.user_id = $2
             ORDER BY t.executed_at DESC`,
            [stockId, userId]
        );

        res.status(200).json({
            trades: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    executeTrade,
    getTrades,
    getTradeById,
    getTradesByStock
};