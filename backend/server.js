const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('./config');
const log = require('./utils/log');

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS: allow only the configured origins when provided
app.use(cors(config.corsOrigins.length ? { origin: config.corsOrigins } : undefined));

// Body parsing
app.use(express.json());

// Assign a simple request ID (or honor an incoming X-Request-Id)
// and expose it back as a response header for easy debugging.
app.use((req, res, next) => {
  const incoming = (req.headers['x-request-id'] || req.headers['X-Request-Id'] || '').toString().trim();
  try {
    req.id = incoming || (crypto.randomUUID && crypto.randomUUID()) || Math.random().toString(36).slice(2, 10);
  } catch {
    req.id = incoming || Math.random().toString(36).slice(2, 10);
  }
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Lightweight user id extraction for logs (helps correlate requests)
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
morgan.token('rid', (req) => (req.id ? String(req.id) : '-'));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms rid=:rid uid=:uid'));

// Prepare mongoose options and suppress deprecation warning
mongoose.set('strictQuery', false);

// Extra request log in development only (morgan already covers structured logs)
if (!config.isProduction) {
  app.use((req, _res, next) => {
    log.info(`[REQUEST] ${req.method} ${req.url} rid=${req.id}`);
    next();
  });
}

// Rate limiting
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: 'draft-7', legacyHeaders: false });

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const turfRoutes = require('./routes/turf');
const matchRoutes = require('./routes/match');
const eventRoutes = require('./routes/event');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/events', eventRoutes);

// Health
app.get('/', (_req, res) => res.send('API is working'));
app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// 404 fallback (helps clients)
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));

// Central error handler: ensures a consistent { message } shape
// and avoids leaking stack traces by default.
// If a route calls next(err), it will land here.
// Keep it simple and human-readable.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  log.error('[Unhandled Error]', err?.message || err);
  const status = err?.status || 500;
  const message = err?.message || 'Server error';
  res.status(status).json({ message });
});

// Start only when run directly; export app for tests.
if (require.main === module) {
  const start = async () => {
    if (!config.skipDb) {
      try {
        await mongoose.connect(
          config.mongoUri,
          config.mongoDbName ? { dbName: config.mongoDbName } : undefined
        );
        const c = mongoose.connection;
        const info = {
          host: c.host,
          name: c.name,
          user: c.user || undefined,
          readyState: c.readyState,
        };
        log.info('[MongoDB] connected', info);
      } catch (err) {
        log.error('[MongoDB] connection error:', err?.message || err);
        process.exit(1);
      }
    } else {
      log.info('[MongoDB] connection skipped (SKIP_DB=true)');
    }

    app.listen(config.port, () =>
      log.info(`Server running on port ${config.port} (env: ${config.nodeEnv})`)
    );
  };

  start();
}

module.exports = app;
