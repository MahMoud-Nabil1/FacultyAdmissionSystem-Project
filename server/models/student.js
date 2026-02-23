const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;

const studentSchema = new Schema({
    studentId: {
        type: Number,
        required: [true, 'Student ID is required'],
        unique: true
    },

    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },

    hash: {
        type: String,
        select: false  
    },

    salt: {
        type: String,
        select: false
    },

    gpa: {
        type: Number,
        default: 0.0,
        min: 0,
        max: 5
    },

    completedSubjects: [
        { type: Schema.Types.ObjectId, ref: 'Subject' }
    ],

    requestedSubjects: [
        { type: Schema.Types.ObjectId, ref: 'Subject' }
    ],

    department: {
        type: Schema.Types.ObjectId,
        ref: 'Department'
    }
}, { timestamps: true }); // keeps track of create time and update time

studentSchema.virtual('password')
    .set(function (password) {
        this._password = password;
    });

studentSchema.pre('save', async function () {
    if (!this._password) return;

    const salt = await bcrypt.genSalt(10);
    this.salt = salt;
    this.hash = await bcrypt.hash(this._password, salt);
});

studentSchema.pre('validate', function () {
    if (this.isNew && !this._password) {
        this.invalidate('password', 'Password is required');
    }
});

studentSchema.methods.verifyPassword = function (password) {
    return bcrypt.compare(password, this.hash);
};

module.exports = mongoose.model('Student', studentSchema);