const mongoose = require('mongoose');
const { Schema } = mongoose;

const groupSchema = new Schema({
    number: {
        type: Number,
        required: true,
    },
    subject: {              // Course code (e.g., "math110", "cs101", "phys201")
        type: String,
        required: true,
    },

    type: {
        type: String,
        required: true,
        enum: ['lecture', 'lab', 'tutorial', 'seminar']
    },
    from: {
        type: Number,
        required: true,
    },
    to: {
        type: Number,
        required: true,
    },
    day: {
        type: String,
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    students: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Student'
        }
    ],
    capacity: {
        type: Number,
        required: true,
        min: 1
    }
}, {
    timestamps: true
});

const Group = mongoose.model('Group', groupSchema);

module.exports = { Group };