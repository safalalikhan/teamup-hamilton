const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS
const allowed = process.env.CORS_ORIGIN
  ?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors(
    allowed && allowed.length
      ? { origin: allowed }
      : undefined
  )
);

// Body parsing
app.use(express.json());

// Lightweight user id extraction for logs
app.use((req, _res, next) => {
  try {
    const hdr = req.headers.authorization || req.headers.Authorization || '';
    const raw = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';
    if (raw) {
      const decoded = jwt.decode(raw);
      if (decoded?.userId) req._uid = decoded.userId;
    }
  } catch {}
  next();
});

// Request logs with user id
morgan.token('uid', (req) => (req._uid ? String(req._uid) : '-'));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms uid=:uid'));

// Mongo
const mongoUri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

mongoose
  .connect(mongoUri, dbName ? { dbName } : undefined)
  .then(() => {
    const c = mongoose.connection;
    const info = {
      host: c.host,
      name: c.name,
      user: c.user || undefined,
      readyState: c.readyState,
    };
    console.log('MongoDB connected:', info);
  })
  .catch((err) => console.error('MongoDB connection error:', err.message));

// Request log (dev-level)
app.use((req, _res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// Rate limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: 'draft-7', legacyHeaders: false });

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const turfRoutes = require('./routes/turf');
const matchRoutes = require('./routes/match');
const eventRoutes = require('./routes/event');
const announcementRoutes = require('./routes/announcement');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);

// Health
app.get('/', (_req, res) => res.send('API is working'));
app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// 404 fallback (helps clients)
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));

// Start
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
