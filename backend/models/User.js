const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true }, // hashed

    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'proficient'],
      default: 'beginner',
    },

    preferredPosition: {
      type: String,
      enum: ['goalKeeper', 'attack', 'midField', 'defence', 'noPreference'],
      default: 'noPreference',
    },

    location: {
      address: { type: String, trim: true },
      lat: Number,
      lng: Number,
    },

    role: {
      type: String,
      enum: ['player', 'admin'],
      default: 'player',
    },

    availability: [
      {
        day: {
          type: String,
          enum: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
          required: true,
        },
        startTime: { type: String, required: true }, // "18:00"
        endTime: { type: String, required: true },   // "20:00"
      },
    ],
  },
  { timestamps: true }
);

// Helpful index for lookups
userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
