const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const includeExpired = String(req.query.includeExpired).toLowerCase() === 'true';

    const now = new Date();
    const filter = { publishAt: { $lte: now } };
    if (!includeExpired) {
      filter.$or = [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }];
    }

    const docs = await Announcement.find(filter)
      .sort({ publishAt: -1, createdAt: -1 })
      .limit(limit)
      .populate('createdBy', 'name email role')
      .lean();

    const payload = docs.map((doc) => ({
      _id: doc._id,
      type: 'manual',
      title: doc.title,
      message: doc.message,
      ctaText: doc.ctaText,
      ctaUrl: doc.ctaUrl,
      publishAt: doc.publishAt,
      expiresAt: doc.expiresAt,
      createdBy: doc.createdBy
        ? {
            id: doc.createdBy._id,
            name: doc.createdBy.name,
            email: doc.createdBy.email,
            role: doc.createdBy.role,
          }
        : null,
    }));

    return res.json(payload);
  } catch (error) {
    console.error('[Announcements GET]', error);
    return res.status(500).json({ message: 'Failed to load announcements' });
  }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, message, ctaText, ctaUrl, publishAt, expiresAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    let publishDate = publishAt ? new Date(publishAt) : new Date();
    if (Number.isNaN(publishDate.getTime())) publishDate = new Date();

    let expireDate = expiresAt ? new Date(expiresAt) : undefined;
    if (expireDate && Number.isNaN(expireDate.getTime())) expireDate = undefined;

    if (expireDate && expireDate <= publishDate) {
      return res.status(400).json({ message: 'Expiry must be after publish date' });
    }

    const doc = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      ctaText: ctaText?.trim() || undefined,
      ctaUrl: ctaUrl?.trim() || undefined,
      publishAt: publishDate,
      expiresAt: expireDate,
      createdBy: req.user.userId,
    });

    return res.status(201).json({
      _id: doc._id,
      type: 'manual',
      title: doc.title,
      message: doc.message,
      ctaText: doc.ctaText,
      ctaUrl: doc.ctaUrl,
      publishAt: doc.publishAt,
      expiresAt: doc.expiresAt,
    });
  } catch (error) {
    console.error('[Announcements POST]', error);
    return res.status(500).json({ message: 'Failed to create announcement' });
  }
});

module.exports = router;
