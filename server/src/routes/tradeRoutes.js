const express = require("express");
const {
    executeTrade,
    getTrades,
    getTradeById,
    getTradesByStock
} = require("../controllers/tradeController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, executeTrade);
router.get("/", authMiddleware, getTrades);
router.get("/:tradeId", authMiddleware, getTradeById);
router.get("/stock/:stockId", authMiddleware, getTradesByStock);

module.exports = router;