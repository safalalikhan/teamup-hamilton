const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const verifyToken = require('../middleware/verifyToken');
const { signAuthToken } = require('../utils/jwt');
const log = require('../utils/log');

// Helper to normalize enums from UI labels (optional mapping)
const levelMap = { Beginner: 'beginner', Intermediate: 'intermediate', Advanced: 'proficient' };
const posMap = {
  Goalkeeper: 'goalKeeper',
  Defender: 'defence',
  Midfielder: 'midField',
  Forward: 'attack',
  'No Preference': 'noPreference',
};

function validatePassword(password) {
  const pw = String(password || '');
  const hasLen = pw.length >= 8;
  const hasLetter = /[A-Za-z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  if (!hasLen || !hasLetter || !hasNumber) {
    return 'Password must be at least 8 characters and include a letter and a number';
  }
  return null;
}

// Register a new user
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

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    log.info('[Auth] Register attempt', { email });
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

    // Issue token on register for smoother UX
    const token = signAuthToken(user);

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
    log.error('[Register Error]', err?.message || err);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

// Log a user in
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    email = String(email).trim().toLowerCase();

    log.info('[Auth] Login attempt', { email });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = signAuthToken(user);


    
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
    log.error('[Login Error]', err?.message || err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// Request a password reset token (token is returned only in dev for convenience)
router.post('/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const normalizedEmail = String(email).trim().toLowerCase();
    log.info('[Auth] Password reset request', { email: normalizedEmail });
    const user = await User.findOne({ email: normalizedEmail });
    const genericResponse = {
      message: 'If that email is registered, password reset instructions have been sent.',
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    if (process.env.NODE_ENV !== 'production') {
      genericResponse.resetToken = rawToken;
      log.info('[PasswordReset] token generated', {
        email: user.email,
        expires: user.resetPasswordExpires.toISOString(),
      });
    }

    return res.json(genericResponse);
  } catch (err) {
    log.error('[Request Password Reset Error]', err?.message || err);
    return res.status(500).json({ message: 'Server error during password reset request' });
  }
});

// Reset password using a valid token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const newToken = signAuthToken(user);

    return res.json({
      message: 'Password reset successfully',
      token: newToken,
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
    log.error('[Reset Password Error]', err?.message || err);
    return res.status(500).json({ message: 'Server error during password reset' });
  }
});

// Return current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (err) {
    log.error('[Me Error]', err?.message || err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
