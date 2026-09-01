const express = require("express");
const { signup, login, getMe } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", authMiddleware, getMe);
router.post("/signup", signup);
router.post("/login", login);

module.exports = router;