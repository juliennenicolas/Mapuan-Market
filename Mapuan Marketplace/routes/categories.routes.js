const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, slug, icon FROM categories ORDER BY sort_order, name'
    );
    res.json({ categories: rows });
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ error: 'Could not load categories.' });
  }
});

module.exports = router;
