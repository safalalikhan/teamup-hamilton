const express = require('express');
const Turf = require('../models/Turf');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { lighting, hasGoalposts, isBookable } = req.query;
    const query = {};
    if (lighting !== undefined) query.lighting = lighting === 'true';
    if (hasGoalposts !== undefined) query.hasGoalposts = hasGoalposts === 'true';
    if (isBookable !== undefined) query.isBookable = isBookable === 'true';

    const turfs = await Turf.find(query).sort({ createdAt: -1 });
    return res.json(turfs);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, async (req, res) => {
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

    return res.status(201).json(turf);
  } catch (err) {
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

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const updates = req.body;
    const turf = await Turf.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!turf) return res.status(404).json({ message: 'Turf not found' });
    return res.json(turf);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const turf = await Turf.findByIdAndDelete(req.params.id);
    if (!turf) return res.status(404).json({ message: 'Turf not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;