const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

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

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const turfRoutes = require('./routes/turf');
const matchRoutes = require('./routes/match');
const eventRoutes = require('./routes/event');

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/events', eventRoutes);

// Health
app.get('/', (_req, res) => res.send('API is working'));
app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// 404 fallback (helps clients)
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));

// Start
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
