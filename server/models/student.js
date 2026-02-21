const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: [true, 'Student ID is required'],
        unique: true // MongoDB will automatically reject duplicate IDs!
    },
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    hash: {type: String, required: true},
    salt: {type: String, required: true},
    gpa: {type: Number, default: 0.0},

    completedSubjects: {
        type: [String],
        required: [true, 'Completed subjects are required']
    },
    requestedSubjects: {
        type: [String],
        required: [true, 'Requested subjects are required']
    },

    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    }
});
const Student = mongoose.model('Student', studentSchema);
module.exports = {Student};