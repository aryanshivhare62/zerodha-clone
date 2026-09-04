const express = require("express");
const {
    createOrder,
    getOrders,
    getOrderById,
    cancelOrder
} = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getOrders);
router.get("/:orderId", authMiddleware, getOrderById);
router.delete("/:orderId", authMiddleware, cancelOrder);

module.exports = router;