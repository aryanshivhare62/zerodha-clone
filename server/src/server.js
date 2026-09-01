require("dotenv").config();

const express = require("express");
const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Zerodha Clone API is running");
});

app.get("/db-test", async (req, res) => {
  const result = await pool.query("SELECT * FROM users;");
  res.json(result.rows[0]);
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});