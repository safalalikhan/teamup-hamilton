const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
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
        address: String,
        lat: Number,
        lng: Number
    },
    availability: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true
        },
        startTime: { type: String, required: true }, // Format: "HH:mm"
        endTime: { type: String, required: true }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
