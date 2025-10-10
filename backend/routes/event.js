const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');
const log = require('../utils/log');

// Get all events (public)
router.get('/', async (_req, res) => {
  try {
    const events = await Event.find().sort({ date: 1, createdAt: -1 });
    res.json(events);
  } catch (error) {
    log.error('[Events GET]', error?.message || error);
    res.status(500).json({ message: 'Failed to load events' });
  }
});

// Create event (admin only)
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, date, venue, ctaText, ctaUrl } = req.body;
    if (!title || !description || !date || !venue) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      date,
      venue: venue.trim(),
      ctaText: ctaText?.trim() || '',
      ctaUrl: ctaUrl?.trim() || '',
      createdBy: req.user.userId,
    });

    log.info('[Events POST] Created', { by: req.user.userId, id: event._id, title: event.title });
    res.status(201).json(event);
  } catch (error) {
    log.error('[Events POST]', error?.message || error);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

module.exports = router;
