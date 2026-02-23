const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

const staffSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'academic_guide', 'academic_guide_coordinator', 'reporter']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    hash: {
        type: String,
        select: false
    },
    salt: {
        type: String,
        select: false
    },
    departments: {
        type: [Schema.Types.ObjectId],
        ref: 'Department'
    },
    students: [{
        type: Schema.Types.ObjectId,
        ref: 'Student'
    }]
}, { timestamps: true });

staffSchema.virtual('password')
    .set(function (password) {
        this._password = password;
    });

staffSchema.pre('save', async function () {
    if (!this._password) return;

    const salt = await bcrypt.genSalt(10);
    this.salt = salt;
    this.hash = await bcrypt.hash(this._password, salt);
});

staffSchema.pre('validate', function () {
    if (this.isNew && !this._password) {
        this.invalidate('password', 'Password is required');
    }
});

staffSchema.methods.verifyPassword = function (password) {
    return bcrypt.compare(password, this.hash);
};

const Staff = mongoose.model('Staff', staffSchema);
module.exports = Staff;