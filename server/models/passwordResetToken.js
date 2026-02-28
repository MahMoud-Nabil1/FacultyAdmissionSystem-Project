const mongoose = require('mongoose');

const { Schema } = mongoose;

const passwordResetTokenSchema = new Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        required: true,
        enum: ['student', 'staff']
    },
    expiresAt: {
        type: Date,
        required: true
    },
    
    studentId: {
        type: Number
    }
}, { timestamps: true });

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

