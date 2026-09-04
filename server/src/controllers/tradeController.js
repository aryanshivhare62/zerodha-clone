const pool = require("../config/db");

const executeTrade = async (req, res) => {
    const client = await pool.connect();

    try {
        const { order_id } = req.body;
        const userId = req.user.userId;

        if (!order_id) {
            return res.status(400).json({
                message: "order_id is required"
            });
        }

        // Get pending order
        const orderResult = await client.query(
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

        // Start transaction
        await client.query("BEGIN");

        // Calculate total order value
        const totalAmount = Number(order.price) * Number(order.quantity);

        // Get user's funds
        const fundsResult = await client.query(
            `SELECT available_balance
             FROM funds
             WHERE user_id = $1
             FOR UPDATE`,
            [userId]
        );

        if (fundsResult.rows.length === 0) {
            throw new Error("Funds account not found");
        }

        const availableBalance = Number(
            fundsResult.rows[0].available_balance
        );

        // Check balance for BUY
        if (order.type === "BUY" && availableBalance < totalAmount) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Insufficient funds"
            });
        }

        // Check existing holding
        const holdingResult = await client.query(
            `SELECT quantity, average_price
             FROM holdings
             WHERE user_id = $1
             AND stock_id = $2
             FOR UPDATE`,
            [userId, order.stock_id]
        );

        if (order.type === "BUY") {
            await client.query(
                `UPDATE funds
                 SET available_balance = available_balance - $1,
                 used_balance = used_balance + $1,
                 updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2`,
                [totalAmount, userId]
            );
        }

        if (order.type === "SELL") {
            if (holdingResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "You do not own this stock"
                });
            }

            const holding = holdingResult.rows[0];

            const currentQuantity = Number(holding.quantity);
            const sellQuantity = Number(order.quantity);

            if (currentQuantity < sellQuantity) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    message: "Insufficient shares"
                });
            }

            const remainingQuantity = currentQuantity - sellQuantity;

            if (remainingQuantity === 0) {
                // All shares sold
                await client.query(
                    `DELETE FROM holdings
                     WHERE user_id = $1
                     AND stock_id = $2`,
                    [userId, order.stock_id]
                );
            } else {
                // Reduce holding quantity
                await client.query(
                    `UPDATE holdings
                     SET quantity = $1,
                     updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $2
                     AND stock_id = $3`,
                    [
                        remainingQuantity,
                        userId,
                        order.stock_id
                    ]
                );
            }

            // Add received money to available balance
            await client.query(
                `UPDATE funds
                 SET available_balance = available_balance + $1,
                 updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $2`,
                [totalAmount, userId]
            );
        }

        // Create trade
        const tradeResult = await client.query(
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

        if (order.type === "BUY") {

            if (holdingResult.rows.length === 0) {

                // First time buying this stock
                await client.query(
                    `INSERT INTO holdings
                     (user_id, stock_id, quantity, average_price)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        userId,
                        order.stock_id,
                        order.quantity,
                        order.price
                    ]
                );

            } else {

                // Existing holding
                const holding = holdingResult.rows[0];

                const oldQuantity = Number(holding.quantity);
                const oldAveragePrice = Number(holding.average_price);

                const newQuantity = oldQuantity + Number(order.quantity);

                const newAveragePrice =
                    (
                        (oldQuantity * oldAveragePrice) +
                        (Number(order.quantity) * Number(order.price))
                    ) / newQuantity;

                await client.query(
                    `UPDATE holdings
                     SET quantity = $1,
                     average_price = $2,
                     updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $3
                     AND stock_id = $4`,
                    [
                        newQuantity,
                        newAveragePrice,
                        userId,
                        order.stock_id
                    ]
                );
            }
        }

        // Mark order as completed
        await client.query(
            `UPDATE orders
             SET status = 'COMPLETED'
             WHERE id = $1`,
            [order.id]
        );

        // Commit transaction
        await client.query("COMMIT");

        res.status(201).json({
            message: "Trade executed successfully",
            trade: tradeResult.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({
            message: "Trade execution failed"
        });

    } finally {
        client.release();
    }
};

const getTrades = async (req, res) => {
    try {
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

    } catch (error) {
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