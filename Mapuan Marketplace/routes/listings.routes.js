const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `listing-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPG, PNG, WEBP, or GIF images are allowed.'));
  }
});

const LISTING_SELECT = `
  SELECT
    l.id, l.title, l.description, l.price, l.item_condition, l.meetup_location,
    l.image_url, l.status, l.created_at, l.updated_at,
    c.id AS category_id, c.name AS category_name, c.slug AS category_slug, c.icon AS category_icon,
    u.id AS seller_id, u.full_name AS seller_name, u.campus AS seller_campus,
    u.course AS seller_course, u.avatar_color AS seller_avatar_color,
    u.created_at AS seller_since
  FROM listings l
  JOIN categories c ON c.id = l.category_id
  JOIN users u ON u.id = l.seller_id
`;

function mapListing(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    condition: row.item_condition,
    meetupLocation: row.meetup_location,
    imageUrl: row.image_url,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category: {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
      icon: row.category_icon
    },
    seller: {
      id: row.seller_id,
      name: row.seller_name,
      campus: row.seller_campus,
      course: row.seller_course,
      avatarColor: row.seller_avatar_color,
      memberSince: row.seller_since
    }
  };
}

router.get('/', async (req, res) => {
  try {
    const { q, category, campus, condition, minPrice, maxPrice, sort } = req.query;
    const where = ["l.status = 'Available'", "u.is_active = 1"];
    const params = [];

    if (q && q.trim()) {
      where.push('(l.title LIKE ? OR l.description LIKE ?)');
      params.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }
    if (category) {
      where.push('c.slug = ?');
      params.push(category);
    }
    if (campus && campus !== 'Either Campus') {
      where.push("(l.meetup_location = ? OR l.meetup_location = 'Either Campus')");
      params.push(campus);
    }
    if (condition) {
      where.push('l.item_condition = ?');
      params.push(condition);
    }
    if (minPrice !== undefined && minPrice !== '') {
      where.push('l.price >= ?');
      params.push(Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== '') {
      where.push('l.price <= ?');
      params.push(Number(maxPrice));
    }

    let orderBy = 'l.created_at DESC';
    if (sort === 'price_asc') orderBy = 'l.price ASC';
    if (sort === 'price_desc') orderBy = 'l.price DESC';
    if (sort === 'oldest') orderBy = 'l.created_at ASC';

    const [rows] = await pool.query(
      `${LISTING_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${orderBy}`,
      params
    );

    res.json({ listings: rows.map(mapListing) });
  } catch (err) {
    console.error('Browse listings error:', err);
    res.status(500).json({ error: 'Could not load listings.' });
  }
});

router.get('/mine', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `${LISTING_SELECT} WHERE l.seller_id = ? ORDER BY l.created_at DESC`,
    [req.user.id]
  );
  res.json({ listings: rows.map(mapListing) });
});

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(`${LISTING_SELECT} WHERE l.id = ?`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Listing not found.' });
  res.json({ listing: mapListing(rows[0]) });
});

router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, categoryId, condition, meetupLocation } = req.body;
    if (!title || price === undefined || !categoryId) {
      return res.status(400).json({ error: 'Title, price, and category are required.' });
    }

    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ error: 'Enter a valid price.' });
    }

    const safeCondition = ['New', 'Like New', 'Good', 'Fair', 'Worn'].includes(condition)
      ? condition
      : 'Good';

    const safeMeetup = ['Intramuros Campus', 'Makati Campus', 'Either Campus'].includes(meetupLocation)
      ? meetupLocation
      : 'Either Campus';

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO listings
       (seller_id, category_id, title, description, price, item_condition, meetup_location, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        categoryId,
        String(title).trim(),
        String(description || '').trim(),
        numericPrice,
        safeCondition,
        safeMeetup,
        imageUrl
      ]
    );

    const [rows] = await pool.query(`${LISTING_SELECT} WHERE l.id = ?`, [result.insertId]);
    res.status(201).json({ listing: mapListing(rows[0]) });
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Could not create your listing.' });
  }
});

router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
  const [existingRows] = await pool.query('SELECT * FROM listings WHERE id = ?', [req.params.id]);
  if (!existingRows.length) return res.status(404).json({ error: 'Listing not found.' });

  const listing = existingRows[0];
  if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You can only edit your own listings.' });
  }

  const { title, description, price, categoryId, condition, meetupLocation, status } = req.body;

  const safeCondition = ['New', 'Like New', 'Good', 'Fair', 'Worn'].includes(condition)
    ? condition
    : listing.item_condition;
  const safeMeetup = ['Intramuros Campus', 'Makati Campus', 'Either Campus'].includes(meetupLocation)
    ? meetupLocation
    : listing.meetup_location;
  const safeStatus = ['Available', 'Reserved', 'Sold', 'Removed'].includes(status)
    ? status
    : listing.status;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : listing.image_url;

  await pool.query(
    `UPDATE listings SET
      title = ?, description = ?, price = ?, category_id = ?,
      item_condition = ?, meetup_location = ?, status = ?, image_url = ?
     WHERE id = ?`,
    [
      title ? String(title).trim() : listing.title,
      description !== undefined ? String(description).trim() : listing.description,
      price !== undefined && price !== '' ? Number(price) : listing.price,
      categoryId || listing.category_id,
      safeCondition,
      safeMeetup,
      safeStatus,
      imageUrl,
      req.params.id
    ]
  );

  const [rows] = await pool.query(`${LISTING_SELECT} WHERE l.id = ?`, [req.params.id]);
  res.json({ listing: mapListing(rows[0]) });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM listings WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Listing not found.' });

  const listing = rows[0];
  if (listing.seller_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You can only remove your own listings.' });
  }

  await pool.query("UPDATE listings SET status = 'Removed' WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
