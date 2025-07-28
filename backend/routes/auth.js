const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


router.post('/register', async (req, res) => {
  try {
    console.log("✅ [REGISTER] Hit endpoint");
    console.log("Request body:", req.body);
    
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

module.exports = router;