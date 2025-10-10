// Tiny logging helper. Info/debug logs are muted in production.
const { isProduction } = require('../config');

function info(...args) {
  if (!isProduction) console.info(...args);
}

function warn(...args) {
  if (!isProduction) console.warn(...args);
}

function error(...args) {
  console.error(...args);
}

module.exports = { info, warn, error };

