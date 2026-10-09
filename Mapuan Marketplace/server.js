const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { verifyConnection } = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/categories.routes');
const listingRoutes = require('./routes/listings.routes');
const messageRoutes = require('./routes/messages.routes');
const userRoutes = require('./routes/users.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'Mapuan Marketplace' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Image must be 5MB or smaller.' });
  }
  res.status(500).json({ error: err.message || 'Unexpected server error.' });
});

app.listen(PORT, async () => {
  console.log(`Mapuan Marketplace running at http://localhost:${PORT}`);
  await verifyConnection();
});
