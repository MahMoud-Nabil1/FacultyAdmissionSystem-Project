const mongoose = require('mongoose');
const { Schema } = mongoose;

const announcementSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        default: 'Admin'
    }
}, {
    timestamps: true
});

const settingsSchema = new Schema({
    gpaMin: {
        type: Number,
        required: true,
        default: 2.5,
        min: 0,
        max: 5
    },
    gpaMax: {
        type: Number,
        required: true,
        default: 5,
        min: 0,
        max: 5
    },
    level: {
        type: [String],
        required: true,
        default: ['1'],
        enum: ['1', '2', '3', '4']
    },
    updatedBy: {
        type: String,
        default: 'Admin'
    }
}, {
    timestamps: true
});

const Announcement = mongoose.model('Announcement', announcementSchema);
const Settings = mongoose.model('Settings', settingsSchema);

module.exports = { Announcement, Settings };