const User = require('../models/User');

async function requireAdmin(req, res, next) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let role = req.user.role;
    let user = null;

    if (!role) {
      user = await User.findById(req.user.userId).select('role');
      role = user?.role;
    }

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Admin privileges required' });
    }

    if (!user) {
      user = await User.findById(req.user.userId).select('role');
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error('[requireAdmin]', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = requireAdmin;
