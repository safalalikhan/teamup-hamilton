const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    time: { type: String, trim: true }, // optional "18:30"
    turf: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf' },

    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

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

module.exports = mongoose.model('Match', matchSchema);