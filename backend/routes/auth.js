const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/verifyToken');

// Helper to normalize enums from UI labels (optional mapping)
const levelMap = { Beginner: 'beginner', Intermediate: 'intermediate', Advanced: 'proficient' };
const posMap = {
  Goalkeeper: 'goalKeeper',
  Defender: 'defence',
  Midfielder: 'midField',
  Forward: 'attack',
  'No Preference': 'noPreference',
};

router.post('/register', async (req, res) => {
  try {
    let {
      name,
      email,
      password,
      skillLevel,
      preferredPosition,
      location,
      availability,
    } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Missing required fields: name, email, password' });
    }

    // normalize email
    email = String(email).trim().toLowerCase();

    // normalize optional fields
    if (!preferredPosition && req.body.position) preferredPosition = req.body.position;
    if (typeof location === 'string') location = { address: location };
    if (!location && req.body.locationAddress) location = { address: req.body.locationAddress };

    if (skillLevel && levelMap[skillLevel]) skillLevel = levelMap[skillLevel];
    if (preferredPosition && posMap[preferredPosition]) {
      preferredPosition = posMap[preferredPosition];
    }

    // basic password policy: min 8, at least one letter and one number
    const pw = String(password);
    const hasLen = pw.length >= 8;
    const hasLetter = /[A-Za-z]/.test(pw);
    const hasNumber = /\d/.test(pw);
    if (!hasLen || !hasLetter || !hasNumber) {
      return res.status(400).json({ message: 'Password must be at least 8 characters and include a letter and a number' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      skillLevel,
      preferredPosition,
      location,
      availability,
    });

    // (Optional) issue token on register for smoother UX
    const payload = {
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skillLevel: user.skillLevel,
        preferredPosition: user.preferredPosition,
        location: user.location,
        availability: user.availability,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    email = String(email).trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const payload = {
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      role: user.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skillLevel: user.skillLevel,
        preferredPosition: user.preferredPosition,
        location: user.location,
        availability: user.availability,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    console.error('[Me Error]', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
