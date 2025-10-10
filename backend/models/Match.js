const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    time: { type: String, trim: true }, // optional "18:30"
    turf: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf' },

    location: {
      address: { type: String, trim: true },
      lat: Number,
      lng: Number,
    },

    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // RSVP statuses for each user
    rsvps: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['going', 'maybe', 'not_going'], required: true },
      },
    ],

    // Optional capacity limit for "going" participants
    capacity: { type: Number, min: 1 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    teams: {
      teamA: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      teamB: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },

    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
  },
  { timestamps: true }
);

// Helpful indexes
matchSchema.index({ date: 1 });
matchSchema.index({ status: 1, date: 1 });
matchSchema.index({ createdBy: 1, date: 1 });

module.exports = mongoose.model('Match', matchSchema);
