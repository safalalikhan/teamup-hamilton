const express = require('express');
const Match = require('../models/Match');
const verifyToken = require('../middleware/verifyToken');
const rateLimit = require('express-rate-limit');

const router = express.Router();

function computeDerived(m) {
  const now = new Date();
  const start = new Date(m.date);
  const isPast = start < now;
  const isToday = start.toDateString() === now.toDateString();
  const startsInMinutes = Math.round((start.getTime() - now.getTime()) / 60000);
  const rsvps = Array.isArray(m.rsvps) ? m.rsvps : [];
  const goingCount = rsvps.filter((r) => r.status === 'going').length || (m.players ? m.players.length : 0);
  const maybeCount = rsvps.filter((r) => r.status === 'maybe').length;
  const notGoingCount = rsvps.filter((r) => r.status === 'not_going').length;
  const capacity = m.capacity ?? null;
  const spotsLeft = capacity != null ? Math.max(0, capacity - goingCount) : null;
  return { isPast, isToday, startsInMinutes, goingCount, maybeCount, notGoingCount, spotsLeft };
}

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const query = {};
    // Basic cursor by date; pass ?cursor=ISO to fetch after that date
    if (req.query.cursor) {
      const c = new Date(String(req.query.cursor));
      if (!Number.isNaN(c.getTime())) query.date = { $gt: c };
    }
    const matches = await Match.find(query)
      .populate('turf')
      .populate('players', 'name email')
      .sort({ date: 1, createdAt: -1 })
      .limit(limit);

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

// Status change (owner or admin). Allow setting to Cancelled; allow Completed if past.
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    const isOwner = String(match.createdBy || '') === String(req.user.userId || '');
    const isAdmin = String(req.user.role || '') === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });
    const next = String(req.body.status || '');
    if (!['Cancelled', 'Completed', 'Scheduled'].includes(next)) return res.status(400).json({ message: 'Invalid status' });
    if (next === 'Completed' && match.date && new Date(match.date) > new Date() && !isAdmin) {
      return res.status(400).json({ message: 'Cannot complete a future match' });
    }
    match.status = next;
    await match.save();
    const obj = match.toObject({ virtuals: true });
    Object.assign(obj, computeDerived(obj));
    return res.json(obj);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { date, time, turf, capacity, location } = req.body;
    if (!date) return res.status(400).json({ message: 'date is required' });
    // Coerce to Date and validate minimum lead time (30 minutes)
    const start = new Date(date);
    if (Number.isNaN(start.getTime())) return res.status(400).json({ message: 'Invalid date' });
    const minLead = new Date(Date.now() + 30 * 60 * 1000);
    if (start < minLead) return res.status(400).json({ message: 'Match must be scheduled at least 30 minutes in advance' });
    let matchLocation;
    if (location) {
      const latNum = Number(location.lat);
      const lngNum = Number(location.lng);
      if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
        return res.status(400).json({ message: 'Location coordinates are invalid' });
      }
      matchLocation = {
        address: typeof location.address === 'string' ? location.address.trim() : undefined,
        lat: latNum,
        lng: lngNum,
      };
    }

    const match = await Match.create({
      date: start.toISOString(),
      time,
      turf,
      location: matchLocation,
      createdBy: req.user.userId,
      players: [],
      capacity: typeof capacity === 'number' ? capacity : (capacity ? Number(capacity) : undefined),
    });
    return res.status(201).json(match);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update match (capacity only for now) — owner or admin
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });
    const isOwner = String(match.createdBy || '') === String(req.user.userId || '');
    const isAdmin = String(req.user.role || '') === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    if ('capacity' in req.body) {
      const raw = req.body.capacity;
      const capNum = Number(raw);
      if (!Number.isFinite(capNum) || capNum < 0) {
        return res.status(400).json({ message: 'Invalid capacity' });
      }
      match.capacity = capNum > 0 ? capNum : undefined;
    }

    await match.save();
    const obj = match.toObject({ virtuals: true });
    Object.assign(obj, computeDerived(obj));
    return res.json(obj);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// RSVP endpoint: { status: 'going' | 'maybe' | 'not_going' }
const rsvpLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false });
router.post('/:id/rsvp', rsvpLimiter, verifyToken, async (req, res) => {
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
