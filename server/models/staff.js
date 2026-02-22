import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const { Schema } = mongoose;

const staffSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'academic_guide', 'academic_guide_coordinator', 'Reporter']
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
        required: true,
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
    .set(function(password) {
        this._password = password;
    });

staffSchema.pre('save', async function(next) {
    if (!this._password) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.salt = salt;
        this.hash = await bcrypt.hash(this._password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

staffSchema.pre('validate', function(next) {
    if (this.isNew && !this._password) {
        this.invalidate('password', 'Password is required');
    }
    next();
});

staffSchema.methods.verifyPassword = function(password) {
    return bcrypt.compare(password, this.hash);
};

staffSchema.pre(/^find/, function(next) {
    console.log("Staff query:", this.getQuery());
    next();
});

const Staff = mongoose.model('Staff', staffSchema);
export default Staff;