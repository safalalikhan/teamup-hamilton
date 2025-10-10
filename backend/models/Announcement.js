const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    ctaText: { type: String, trim: true },
    ctaUrl: { type: String, trim: true },
    publishAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

announcementSchema.index({ publishAt: -1 });
announcementSchema.index({ expiresAt: 1 });
announcementSchema.index({ createdBy: 1, publishAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
