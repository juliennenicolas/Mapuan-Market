const express = require('express');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, full_name, email, campus, course, role, avatar_color, created_at
     FROM users WHERE id = ?`,
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: rows[0] });
});

router.put('/profile', requireAuth, async (req, res) => {
  const { fullName, campus, course, avatarColor } = req.body;
  const safeCampus = ['Intramuros Campus', 'Makati Campus'].includes(campus)
    ? campus
    : 'Intramuros Campus';

  await pool.query(
    `UPDATE users SET full_name = ?, campus = ?, course = ?, avatar_color = ?
     WHERE id = ?`,
    [
      String(fullName || '').trim(),
      safeCampus,
      String(course || '').trim(),
      String(avatarColor || '#D71920'),
      req.user.id
    ]
  );

  res.json({ success: true });
});

module.exports = router;
