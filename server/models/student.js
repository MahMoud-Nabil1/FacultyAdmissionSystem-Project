const mongoose = require('mongoose');
const { Schema } = mongoose;

const studentSchema = new Schema({
    id: {
        type: Number,
        required: [true, 'Student ID is required'],
        unique: true
    },

    name: {
        type: String,
        required: [true, 'Name is required']
    },

    hash: {
        type: String,
        required: true
    },

    salt: {
        type: String,
        required: true
    },

    gpa: {
        type: Number,
        default: 0.0
    },

    completedSubjects: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Subjects'
        }
    ],

    requestedSubjects: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Subjects'
        }
    ],

    department: {
        type: Schema.Types.ObjectId,
        ref: 'Departments'
    }
});

studentSchema.virtual('password')
    .set(function(passwordValue) {
        this._password = passwordValue;

        this.salt = "mock_generated_salt";
        this.hash = "mock_hashed_version_of_" + passwordValue;
    });

studentSchema.pre('validate', function(next) {
    if (this.isNew && !this._password) {
        this.invalidate('password', 'Password is required');
    }
    next();
});


const Student = mongoose.model('Student', studentSchema);

module.exports = { Student };