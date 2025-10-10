// Small JWT helper to keep token creation in one place
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

// Creates a short-lived auth token containing safe user fields.
function signAuthToken(user) {
  const payload = {
    userId: user._id,
    userName: user.name,
    userEmail: user.email,
    role: user.role,
  };
  return jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
}

module.exports = { signAuthToken };

