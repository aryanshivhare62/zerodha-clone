const express = require("express")

const { getHoldings, getHoldingById } = require("../controllers/holdingController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getHoldings);
router.get("/:holdingId", authMiddleware, getHoldingById);

module.exports = router;
