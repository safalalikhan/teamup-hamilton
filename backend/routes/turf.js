const express = require('express');
const Turf = require('../models/Turf');
const verifyToken = require('../middleware/verifyToken');
const requireAdmin = require('../middleware/requireAdmin');
const log = require('../utils/log');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { lighting, hasGoalposts, isBookable, lat, lng, radiusKm } = req.query;
    const query = {};
    if (lighting !== undefined) query.lighting = lighting === 'true';
    if (hasGoalposts !== undefined) query.hasGoalposts = hasGoalposts === 'true';
    if (isBookable !== undefined) query.isBookable = isBookable === 'true';

    const docs = await Turf.find(query).sort({ createdAt: -1 });

    const latNum = Number(lat);
    const lngNum = Number(lng);
    const hasCoords = !Number.isNaN(latNum) && !Number.isNaN(lngNum);
    const radiusNum = Number(radiusKm);
    const useRadius = hasCoords && Number.isFinite(radiusNum) && radiusNum > 0;

    const toRad = (deg) => (deg * Math.PI) / 180;
    const calcDistanceKm = (aLat, aLng) => {
      const R = 6371; // Earth radius in km
      const dLat = toRad(aLat - latNum);
      const dLng = toRad(aLng - lngNum);
      const originLat = toRad(latNum);
      const targetLat = toRad(aLat);
      const sinDLat = Math.sin(dLat / 2);
      const sinDLng = Math.sin(dLng / 2);
      const h = sinDLat * sinDLat + Math.cos(originLat) * Math.cos(targetLat) * sinDLng * sinDLng;
      return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    };

    let list = docs.map((doc) => {
      const obj = doc.toObject();
      if (hasCoords && obj.location?.lat != null && obj.location?.lng != null) {
        obj.distanceKm = Number(calcDistanceKm(Number(obj.location.lat), Number(obj.location.lng)).toFixed(2));
      }
      return obj;
    });

    if (hasCoords) {
      list = list
        .filter((item) => item.distanceKm != null && (!useRadius || item.distanceKm <= radiusNum))
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    return res.json(list);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, location, lighting, hasGoalposts, isBookable, availableTimeSlots } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const turf = await Turf.create({
      name,
      location,
      lighting,
      hasGoalposts,
      isBookable,
      availableTimeSlots,
    });
    log.info('[Turf] Created', { by: req.user.userId, id: turf._id, name: turf.name });
    return res.status(201).json(turf);
  } catch (err) {
    log.error('[Turf] Create failed', err?.message || err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ message: 'Turf not found' });
    return res.json(turf);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    const turf = await Turf.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!turf) return res.status(404).json({ message: 'Turf not found' });
    log.info('[Turf] Updated', { by: req.user.userId, id: turf._id });
    return res.json(turf);
  } catch (err) {
    log.error('[Turf] Update failed', err?.message || err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const turf = await Turf.findByIdAndDelete(req.params.id);
    if (!turf) return res.status(404).json({ message: 'Turf not found' });
    log.info('[Turf] Deleted', { by: req.user.userId, id: req.params.id });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    log.error('[Turf] Delete failed', err?.message || err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
