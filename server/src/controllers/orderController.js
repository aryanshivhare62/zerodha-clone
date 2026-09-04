const pool = require("../config/db");

const createOrder = async (req, res) => {
    try {
        const { stock_id, type, quantity } = req.body;
        const userId = req.user.userId;

        // 1. Validate input
        if (!stock_id || !type || !quantity) {
            return res.status(400).json({
                message: "stock_id, type and quantity are required"
            });
        }

        // 2. Validate order type
        if (type !== "BUY" && type !== "SELL") {
            return res.status(400).json({
                message: "Order type must be BUY or SELL"
            });
        }

        // 3. Validate quantity
        if (quantity <= 0) {
            return res.status(400).json({
                message: "Quantity must be greater than 0"
            });
        }

        // 4. Check whether stock exists
        const stockResult = await pool.query(
            `SELECT id, symbol, current_price
             FROM stocks
             WHERE id = $1`,
            [stock_id]
        );

        if (stockResult.rows.length === 0) {
            return res.status(404).json({
                message: "Stock not found"
            });
        }

        const stock = stockResult.rows[0];

        // 5. Create order
        const result = await pool.query(
            `INSERT INTO orders
             (user_id, stock_id, type, quantity, price, status)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                userId,
                stock_id,
                type,
                quantity,
                stock.current_price,
                "PENDING"
            ]
        );

        // 6. Send response
        res.status(201).json({
            message: "Order placed successfully",
            order: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getOrders = async (req, res) => {
    try{
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT
                o.id,
                o.stock_id,
                s.symbol,
                s.company_name,
                o.type,
                o.quantity,
                o.price,
                o.status,
                o.created_at
             FROM orders o
             JOIN stocks s
             ON o.stock_id = s.id
             WHERE o.user_id = $1
             ORDER BY o.created_at DESC`,
            [userId]
        );

        return res.status(200).json({
            Orders: result.rows
        });

    }catch (error) {
        console.log(error);

        res.status(500).json({
            message: "server error"
        });
    }
};

const getOrderById = async (req, res) => {
    try{
        const { orderId } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT
                o.id,
                o.stock_id,
                s.symbol,
                s.company_name,
                s.exchange,
                o.type,
                o.quantity,
                o.price,
                o.status,
                o.created_at
             FROM orders o
             JOIN stocks s
             ON o.stock_id = s.id
             WHERE o.id = $1
             AND o.user_id = $2`,
            [orderId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json({
            order: result.rows[0]
        });

    }catch (error) {
        console.log(error);

        return res.status(500).json({
            message: "server error"
        });
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            `UPDATE orders
             SET status = 'CANCELLED'
             WHERE id = $1
             AND user_id = $2
             AND status = 'PENDING'
             RETURNING *`,
            [orderId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Order not found or cannot be cancelled"
            });
        }

        res.status(200).json({
            message: "Order cancelled successfully",
            order: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    cancelOrder
};