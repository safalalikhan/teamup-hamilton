// Centralized configuration for the backend
// Reads environment variables once, provides simple validation, and
// exposes values with clear names. Keep comments human-friendly.

// Load env from the backend/.env file explicitly to avoid CWD issues
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const skipDb = String(process.env.SKIP_DB || '').toLowerCase() === 'true';

// Read envs with small helpers
const mongoUri = (process.env.MONGO_URI || '').trim();
const mongoDbName = (process.env.MONGO_DB_NAME || '').trim();
const jwtSecret = (process.env.JWT_SECRET || '').trim();
const port = Number((process.env.PORT || '').trim()) || 5001;
const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Simple validation: in production, fail fast; in dev, warn
function validate() {
  const missing = [];
  if (!mongoUri) missing.push('MONGO_URI');
  if (!jwtSecret) missing.push('JWT_SECRET');
  if (missing.length) {
    const msg = `Missing required envs: ${missing.join(', ')}`;
    // In production OR when not explicitly skipping DB, fail fast.
    if (isProduction || !skipDb) {
      // eslint-disable-next-line no-console
      console.error(`[Config] ${msg}. Set them in backend/.env`);
      // eslint-disable-next-line no-console
      console.error(`[Config] Loaded env from ${envPath}`);
      process.exit(1);
    }
    // Dev/test with SKIP_DB=true can continue (health checks, etc.)
    // eslint-disable-next-line no-console
    console.warn(`[Config] ${msg} (SKIP_DB=true: continuing for dev/test).`);
    // eslint-disable-next-line no-console
    console.warn(`[Config] Loaded env from ${envPath}`);
  }
}

validate();

module.exports = {
  nodeEnv,
  isProduction,
  skipDb,
  mongoUri,
  mongoDbName,
  jwtSecret,
  port,
  corsOrigins,
};
