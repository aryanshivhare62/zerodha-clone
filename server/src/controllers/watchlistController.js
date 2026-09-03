const pool = require("../config/db");

const createWatchlist = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.userId;

        if (!name) {
            return res.status(400).json({
                message: "Watchlist name is required"
            });
        }

        const result = await pool.query(
            `INSERT INTO watchlists (user_id, name)
             VALUES ($1, $2)
             RETURNING *`,
            [userId, name]
        );

        res.status(201).json({
            message: "Watchlist created successfully",
            watchlist: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getWatchlists = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT *
             FROM watchlists
             WHERE user_id = $1
             ORDER BY id ASC`,
            [userId]
        );

        res.status(200).json({
            watchlists: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const addStockToWatchlist = async (req, res) => {
    try {
        const { watchlistId } = req.params;
        const { stock_id } = req.body;
        const userId = req.user.userId;

        if (!stock_id) {
            return res.status(400).json({
                message: "stock_id is required"
            });
        }

        const watchlist = await pool.query(
            `SELECT id
             FROM watchlists
             WHERE id = $1 AND user_id = $2`,
            [watchlistId, userId]
        );

        if (watchlist.rows.length === 0) {
            return res.status(404).json({
                message: "Watchlist not found"
            });
        }

        const result = await pool.query(
            `INSERT INTO watchlist_stocks
             (watchlist_id, stock_id)
             VALUES ($1, $2)
             RETURNING *`,
            [watchlistId, stock_id]
        );

        res.status(201).json({
            message: "Stock added to watchlist",
            watchlistStock: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getWatchlistStocks = async (req, res) => {
    try {
        const { watchlistId } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            `SELECT 
                ws.id,
                ws.watchlist_id,
                s.id AS stock_id,
                s.symbol,
                s.company_name,
                s.exchange,
                s.current_price
             FROM watchlist_stocks ws
             JOIN stocks s
             ON ws.stock_id = s.id
             WHERE ws.watchlist_id = $1
             AND EXISTS (
                 SELECT 1
                 FROM watchlists w
                 WHERE w.id = $1
                 AND w.user_id = $2
             )
             ORDER BY ws.id ASC`,
            [watchlistId, userId]
        );

        res.status(200).json({
            stocks: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// DELETE /api/watchlists/:watchlistId/stocks/:stockId
const removeStockFromWatchlist = async (req, res) => {
    try {
        const { watchlistId, stockId } = req.params;
        const userId = req.user.userId;

        // Check whether watchlist belongs to logged-in user
        const watchlist = await pool.query(
            `SELECT id
             FROM watchlists
             WHERE id = $1 AND user_id = $2`,
            [watchlistId, userId]
        );

        if (watchlist.rows.length === 0) {
            return res.status(404).json({
                message: "Watchlist not found"
            });
        }

        // Delete stock from watchlist
        const result = await pool.query(
            `DELETE FROM watchlist_stocks
             WHERE watchlist_id = $1
             AND stock_id = $2
             RETURNING *`,
            [watchlistId, stockId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Stock not found in watchlist"
            });
        }

        res.status(200).json({
            message: "Stock removed from watchlist",
            removedStock: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

// DELETE /api/watchlists/:watchlistId
const deleteWatchlist = async (req, res) => {
    try {
        const { watchlistId } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            `DELETE FROM watchlists
             WHERE id = $1
             AND user_id = $2
             RETURNING *`,
            [watchlistId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Watchlist not found"
            });
        }

        res.status(200).json({
            message: "Watchlist deleted successfully",
            watchlist: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    createWatchlist,
    getWatchlists,
    addStockToWatchlist,
    getWatchlistStocks,
    removeStockFromWatchlist,
    deleteWatchlist
};