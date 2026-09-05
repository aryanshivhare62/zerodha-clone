const express = require("express");

const {
    getFunds,
    depositFunds,
    withdrawFunds
} = require("../controllers/fundController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getFunds);
router.post("/deposit", authMiddleware, depositFunds);
router.post("/withdraw", authMiddleware, withdrawFunds);


module.exports = router;