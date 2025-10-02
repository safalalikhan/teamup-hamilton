const express = require('express');
const Match = require('../models/Match');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

function computeDerived(m) {
  const now = new Date();
  const start = new Date(m.date);
  const isPast = start < now;
  const isToday = start.toDateString() === now.toDateString();
  const startsInMinutes = Math.round((start.getTime() - now.getTime()) / 60000);
  const goingCount = (m.rsvps || []).filter((r) => r.status === 'going').length || (m.players ? m.players.length : 0);
  const capacity = m.capacity ?? null;
  const spotsLeft = capacity != null ? Math.max(0, capacity - goingCount) : null;
  return { isPast, isToday, startsInMinutes, goingCount, spotsLeft };
}

router.get('/', async (_req, res) => {
  try {
    const matches = await Match.find({})
      .populate('turf')
      .populate('players', 'name email')
      .sort({ date: 1, createdAt: -1 });

    const updates = [];
    const out = matches.map((m) => {
      const obj = m.toObject({ virtuals: true });
      const derived = computeDerived(obj);
      Object.assign(obj, derived);
      if (derived.isPast && m.status === 'Scheduled') {
        m.status = 'Completed';
        updates.push(m.save().catch(() => {}));
      }
      return obj;
    });
    if (updates.length) Promise.allSettled(updates).catch(() => {});
    return res.json(out);
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
    const obj = match.toObject({ virtuals: true });
    Object.assign(obj, computeDerived(obj));
    return res.json(obj);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { date, time, turf, capacity } = req.body;
    if (!date) return res.status(400).json({ message: 'date is required' });
    const match = await Match.create({
      date,
      time,
      turf,
      createdBy: req.user.userId,
      players: [],
      capacity: typeof capacity === 'number' ? capacity : (capacity ? Number(capacity) : undefined),
    });
    return res.status(201).json(match);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// RSVP endpoint: { status: 'going' | 'maybe' | 'not_going' }
router.post('/:id/rsvp', verifyToken, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const uid = String(req.user.userId);
    const status = String(req.body.status || '').toLowerCase();
    if (!['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({ message: 'Invalid RSVP status' });
    }

    if (status === 'going' && match.capacity != null) {
      const currentGoing = (match.rsvps || []).filter((r) => r.status === 'going').length;
      if (currentGoing >= match.capacity) return res.status(409).json({ message: 'Match is full' });
    }

    match.rsvps = match.rsvps || [];
    const idx = match.rsvps.findIndex((r) => String(r.user) === uid);
    if (idx >= 0) match.rsvps[idx].status = status; else match.rsvps.push({ user: uid, status });

    // keep legacy players in sync
    const going = match.rsvps.filter((r) => r.status === 'going').map((r) => String(r.user));
    match.players = Array.from(new Set(going));
    await match.save();
    const derived = computeDerived(match);
    return res.json({ ok: true, status, ...derived });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Backward compatibility: map to RSVP
router.post('/:id/join', verifyToken, async (req, res) => {
  req.body.status = 'going';
  return router.handle(req, res);
});

router.post('/:id/leave', verifyToken, async (req, res) => {
  req.body.status = 'not_going';
  return router.handle(req, res);
});

// Announcements of upcoming matches within next windowHours
router.get('/announcements/upcoming', async (req, res) => {
  try {
    const windowHours = Math.max(1, Math.min(168, Number(req.query.windowHours) || 24));
    const now = new Date();
    const end = new Date(now.getTime() + windowHours * 3600 * 1000);
    const raw = await Match.find({ date: { $gte: now, $lte: end }, status: { $ne: 'Cancelled' } })
      .populate('turf')
      .sort({ date: 1 });
    const list = raw
      .map((m) => {
        const obj = m.toObject();
        const derived = computeDerived(obj);
        Object.assign(obj, derived);
        return obj;
      })
      .filter((m) => m.spotsLeft == null || m.spotsLeft > 0);
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
