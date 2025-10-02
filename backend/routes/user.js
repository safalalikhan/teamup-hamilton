const express = require('express');
const router = express.Router();
const User = require('../models/User');
const verifyToken = require('../middleware/verifyToken');

router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/', verifyToken, async (req, res) => {
  try {
    const { role, ...updates } = req.body;
    const updatedUser = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
    }).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    return res.json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
