const express = require('express');
const { pool } = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', async (req, res) => {
  const [[users]] = await pool.query('SELECT COUNT(*) AS total FROM users WHERE is_active = 1');
  const [[listings]] = await pool.query("SELECT COUNT(*) AS total FROM listings WHERE status != 'Removed'");
  const [[messages]] = await pool.query('SELECT COUNT(*) AS total FROM messages');
  res.json({
    users: Number(users.total),
    listings: Number(listings.total),
    messages: Number(messages.total)
  });
});

router.get('/users', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, full_name, email, campus, course, role, is_active, created_at
     FROM users ORDER BY created_at DESC`
  );
  res.json({ users: rows });
});

router.get('/listings', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT l.id, l.title, l.price, l.status, l.created_at, u.full_name AS seller_name
     FROM listings l JOIN users u ON u.id = l.seller_id
     ORDER BY l.created_at DESC`
  );
  res.json({ listings: rows });
});

router.patch('/users/:id/toggle', async (req, res) => {
  await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

router.patch('/listings/:id/remove', async (req, res) => {
  await pool.query("UPDATE listings SET status = 'Removed' WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
