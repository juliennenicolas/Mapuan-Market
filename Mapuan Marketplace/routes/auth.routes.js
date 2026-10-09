const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const MAPUA_DOMAIN = '@mymail.mapua.edu.ph';

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    campus: user.campus,
    course: user.course,
    role: user.role,
    avatarColor: user.avatar_color
  };
}

router.post('/register', async (req, res) => {
  try {
    let { fullName, email, password, campus, course } = req.body;
    fullName = String(fullName || '').trim();
    email = String(email || '').trim().toLowerCase();
    password = String(password || '');

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }

    if (!email.endsWith(MAPUA_DOMAIN)) {
      return res.status(400).json({ error: `Use your Mapua email ending in ${MAPUA_DOMAIN}.` });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    campus = ['Intramuros Campus', 'Makati Campus'].includes(campus)
      ? campus
      : 'Intramuros Campus';

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'That email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const avatarColors = ['#D71920', '#7C3AED', '#2563EB', '#0F766E', '#C2410C', '#334155'];
    const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const [result] = await pool.query(
      `INSERT INTO users
       (full_name, email, password_hash, campus, course, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName, email, passwordHash, campus, String(course || '').trim(), avatarColor]
    );

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Could not create your account.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid email or password.' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Could not log you in.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, campus, course, role, avatar_color FROM users WHERE id = ? AND is_active = 1',
    [req.user.id]
  );

  if (!rows.length) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(rows[0]) });
});

module.exports = router;
