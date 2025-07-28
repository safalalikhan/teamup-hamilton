const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  skillLevel: String,
  preferredPosition: String,
  location: String,
  availability: [String], // days or times
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
