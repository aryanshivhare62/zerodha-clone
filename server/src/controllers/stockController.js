const pool = require("../config/db");

const createStock = async (req, res) => {
    try {
        const { symbol, company_name, exchange, current_price } = req.body;

        if (!symbol || !company_name || !exchange || !current_price) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const result = await pool.query(
            `INSERT INTO stocks
             (symbol, company_name, exchange, current_price)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [symbol, company_name, exchange, current_price]
        );

        res.status(201).json({
            message: "Stock created successfully",
            stock: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getAllStock = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT  * FROM stocks
            ORDER BY id ASC`
        );

        res.status(200).json({
            stock: result.rows
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

const getStockById = async (req, res) => {
    try {
        const id = req.params.id;

        const result = await pool.query(
            `SELECT * FROM stocks
            WHERE id = $1`,
            [id]
        );

        if(result.rows.length === 0){
            return res.status(404).json({
                message: "Stock not found"
            })
        }

        res.status(200).json({
            stock: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = { createStock, getAllStock, getStockById };