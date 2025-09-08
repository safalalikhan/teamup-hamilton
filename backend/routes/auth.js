const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/verifyToken');


router.post('/register', async (req, res) => {
  try {
    //console.log("REGISTER Hit endpoint");
    //console.log("Request body:", req.body);
    
    const { name, email, password, skillLevel, preferredPosition, location, availability } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      skillLevel,
      preferredPosition,
      location,
      availability
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('[Register Error]', err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: 'Invalid email or password' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid email or password' });

    // Create token
    const payload = {
      userId: user._id
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.status(200).json({ token, user: {
      name: user.name,
      email: user.email,
      skillLevel: user.skillLevel,
      preferredPosition: user.preferredPosition,
      location: user.location,
      availability: user.availability
    } });
  } catch (err) {
    console.error('[Login Error]', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user data
// @access  Private
router.get('/me', verifyToken, async (req, res) => {
  try {
    // req.user is set in verifyToken middleware
    const user = await User.findById(req.user.userId).select('-password');;
    if (!user) return res.status(404).json({ message: 'Invalid user' });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user data:', err.message);
    res.status(500).send('Server Error');
  }
});
module.exports = router;