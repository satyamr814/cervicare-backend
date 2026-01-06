const express = require('express');
const pool = require('../config/database');

const router = express.Router();

router.get('/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1 as ok');
    res.json({
      success: true,
      database: 'connected',
      result: result.rows[0]
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      database: 'unreachable',
      code: error.code || 'DB_ERROR',
      message: error.message,
      hint: 'Start PostgreSQL service and ensure DATABASE_URL is correct.'
    });
  }
});

module.exports = router;
