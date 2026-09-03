const express = require("express");
const { createStock, getAllStock, getStockById } = require("../controllers/stockController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", createStock);
router.get("/", getAllStock);
router.get("/:id", getStockById);

module.exports = router;