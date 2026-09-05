const express = require("express")

const { getAllHoldings, getHoldingByStockId } = require("../controllers/holdingController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getAllHoldings);
router.get("/:stockId", authMiddleware, getHoldingByStockId);

module.exports = router;
