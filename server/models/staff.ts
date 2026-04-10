import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IStaff extends Document {
    name: string;
    role: 'admin' | 'academic_guide' | 'academic_guide_coordinator' | 'reporter';
    email: string;
    hash?: string;
    salt?: string;
    departments: mongoose.Types.ObjectId[];
    students: mongoose.Types.ObjectId[];
    currentSessionId?: string | null;
    createdAt: Date;
    updatedAt: Date;

    // Virtual for setting password
    password?: string;
    // Internal property for hashing
    _password?: string;
    verifyPassword(password: string): Promise<boolean>;
}

const staffSchema = new Schema<IStaff>({
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
    }],
    currentSessionId: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

staffSchema.virtual('password')
    .set(function (this: IStaff, password: string) {
        this._password = password;
    });

staffSchema.pre<IStaff>('save', async function () {
    if (!this._password ) return;

    try {
        const salt = await bcrypt.genSalt(10);
        this.salt = salt;
        this.hash = await bcrypt.hash(this._password, salt);
    } catch (err: any) {
        throw err;
    }
});

staffSchema.pre<IStaff>('validate', async function () {
    if (this.isNew && !this._password) {
        this.invalidate('password', 'Password is required', '', 'required');
    }
});
staffSchema.methods.verifyPassword = function (this: IStaff, password: string): Promise<boolean> {
    return bcrypt.compare(password, this.hash || '');
};

const Staff = mongoose.model<IStaff>('Staff', staffSchema);
export default Staff;