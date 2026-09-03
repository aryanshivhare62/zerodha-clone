const express = require("express");

const {
    createWatchlist,
    getWatchlists,
    addStockToWatchlist,
    getWatchlistStocks,
    removeStockFromWatchlist,
    deleteWatchlist
} = require("../controllers/watchlistController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createWatchlist);
router.get("/", authMiddleware, getWatchlists);
router.post("/:watchlistId/stocks", authMiddleware, addStockToWatchlist);
router.get("/:watchlistId/stocks", authMiddleware, getWatchlistStocks);
router.delete("/:watchlistId/stocks/:stockId", authMiddleware, removeStockFromWatchlist);
router.delete("/:watchlistId", authMiddleware, deleteWatchlist);

module.exports = router;