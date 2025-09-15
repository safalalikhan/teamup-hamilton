const express = require('express');
const Match = require('../models/Match');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const matches = await Match.find({})
      .populate('turf')
      .populate('players', 'name email')
      .sort({ date: 1, createdAt: -1 });
    return res.json(matches);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('turf')
      .populate('players', 'name email skillLevel preferredPosition');
    if (!match) return res.status(404).json({ message: 'Match not found' });
    return res.json(match);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { date, time, turf } = req.body;
    if (!date) return res.status(400).json({ message: 'date is required' });
    const match = await Match.create({
      date,
      time,
      turf,
      createdBy: req.user.userId,
      players: [],
    });
    return res.status(201).json(match);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const uid = String(req.user.userId);
    if (!match.players.map(String).includes(uid)) {
      match.players.push(uid);
      await match.save();
    }
    return res.json({ message: 'Joined' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/leave', verifyToken, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const uid = String(req.user.userId);
    match.players = match.players.filter((p) => String(p) !== uid);
    await match.save();
    return res.json({ message: 'Left' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;