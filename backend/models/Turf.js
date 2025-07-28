const mongoose = require('mongoose');

const turfSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    address: String,
    lat: Number,
    lng: Number
  },
  lighting: Boolean,
  hasGoalposts: Boolean,
  isBookable: Boolean,
  availableTimeSlots: [String] // e.g., ["Sat 5-6PM"]
}, { timestamps: true });

module.exports = mongoose.model('Turf', turfSchema);
