const mongoose = require('mongoose');
const { Schema } = mongoose;

const groupSchema = new Schema({
    id:{
        type: String,
        required: true,
        unique: true
    },
    number: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
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
    }
});

const Group = mongoose.model('Group', groupSchema);

module.exports = { Group };