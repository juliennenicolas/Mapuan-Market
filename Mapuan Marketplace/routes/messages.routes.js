const express = require('express');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/threads', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT m.*,
      su.full_name AS sender_name, su.avatar_color AS sender_avatar_color,
      ru.full_name AS receiver_name, ru.avatar_color AS receiver_avatar_color,
      l.title AS listing_title, l.image_url AS listing_image
     FROM messages m
     JOIN users su ON su.id = m.sender_id
     JOIN users ru ON ru.id = m.receiver_id
     LEFT JOIN listings l ON l.id = m.listing_id
     WHERE m.sender_id = ? OR m.receiver_id = ?
     ORDER BY m.created_at DESC`,
    [req.user.id, req.user.id]
  );

  const threads = new Map();

  for (const row of rows) {
    const mine = row.sender_id === req.user.id;
    const otherUserId = mine ? row.receiver_id : row.sender_id;
    const otherUserName = mine ? row.receiver_name : row.sender_name;
    const otherAvatarColor = mine ? row.receiver_avatar_color : row.sender_avatar_color;
    const key = `${otherUserId}:${row.listing_id || 'none'}`;

    if (!threads.has(key)) {
      threads.set(key, {
        otherUserId,
        otherUserName,
        otherAvatarColor,
        listingId: row.listing_id,
        listingTitle: row.listing_title,
        listingImage: row.listing_image,
        lastMessage: row.body,
        lastMessageAt: row.created_at,
        lastMessageIsMine: mine,
        unreadCount: 0
      });
    }

    if (!mine && !row.is_read) {
      threads.get(key).unreadCount += 1;
    }
  }

  res.json({ threads: Array.from(threads.values()) });
});

router.get('/unread-count', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS count FROM messages WHERE receiver_id = ? AND is_read = 0',
    [req.user.id]
  );
  res.json({ count: Number(rows[0].count) });
});

router.get('/thread', requireAuth, async (req, res) => {
  const otherUserId = Number(req.query.withUser);
  const listingId = req.query.listingId ? Number(req.query.listingId) : null;

  if (!otherUserId) {
    return res.status(400).json({ error: 'Conversation partner is required.' });
  }

  const [userRows] = await pool.query(
    'SELECT id, full_name, avatar_color FROM users WHERE id = ? AND is_active = 1',
    [otherUserId]
  );
  if (!userRows.length) return res.status(404).json({ error: 'User not found.' });

  let sql = `
    SELECT * FROM messages
    WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
  `;
  const params = [req.user.id, otherUserId, otherUserId, req.user.id];

  if (listingId) {
    sql += ' AND listing_id = ?';
    params.push(listingId);
  } else {
    sql += ' AND listing_id IS NULL';
  }
  sql += ' ORDER BY created_at ASC';

  const [rows] = await pool.query(sql, params);

  if (listingId) {
    await pool.query(
      'UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND listing_id = ?',
      [req.user.id, otherUserId, listingId]
    );
  } else {
    await pool.query(
      'UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ? AND listing_id IS NULL',
      [req.user.id, otherUserId]
    );
  }

  let listing = null;
  if (listingId) {
    const [listingRows] = await pool.query(
      'SELECT id, title, image_url, price FROM listings WHERE id = ?',
      [listingId]
    );
    if (listingRows.length) {
      listing = {
        id: listingRows[0].id,
        title: listingRows[0].title,
        imageUrl: listingRows[0].image_url,
        price: Number(listingRows[0].price)
      };
    }
  }

  res.json({
    otherUser: {
      id: userRows[0].id,
      name: userRows[0].full_name,
      avatarColor: userRows[0].avatar_color
    },
    listing,
    messages: rows.map(row => ({
      id: row.id,
      listingId: row.listing_id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      body: row.body,
      isRead: !!row.is_read,
      createdAt: row.created_at
    }))
  });
});

router.post('/', requireAuth, async (req, res) => {
  const receiverId = Number(req.body.receiverId);
  const listingId = req.body.listingId ? Number(req.body.listingId) : null;
  const body = String(req.body.body || '').trim();

  if (!receiverId || !body) {
    return res.status(400).json({ error: 'Recipient and message are required.' });
  }

  if (receiverId === req.user.id) {
    return res.status(400).json({ error: "You can't message yourself." });
  }

  const [receiverRows] = await pool.query(
    'SELECT id FROM users WHERE id = ? AND is_active = 1',
    [receiverId]
  );
  if (!receiverRows.length) return res.status(404).json({ error: 'Recipient not found.' });

  const [result] = await pool.query(
    'INSERT INTO messages (listing_id, sender_id, receiver_id, body) VALUES (?, ?, ?, ?)',
    [listingId, req.user.id, receiverId, body]
  );

  const [rows] = await pool.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);
  res.status(201).json({ message: rows[0] });
});

module.exports = router;
