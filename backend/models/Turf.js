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

// Helpful index for search/sort by name
turfSchema.index({ name: 1 });
// Useful for recent-first lists
turfSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Turf', turfSchema);
