const mongoose = require('mongoose');

const turfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: {
      address: { type: String, trim: true },
      lat: Number,
      lng: Number,
    },
    lighting: Boolean,
    hasGoalposts: Boolean,
    isBookable: Boolean,
    availableTimeSlots: [String], // e.g., ["17:00–18:00", "18:00–19:00"]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Turf', turfSchema);