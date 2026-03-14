import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface representing the PasswordResetToken document
 */
export interface IPasswordResetToken extends Document {
    email: string;
    token: string;
    role: 'student' | 'staff';
    expiresAt: Date;
    studentId?: number; // Optional, used for faculty email flow
    createdAt: Date;
    updatedAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>({
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
}, {
    timestamps: true
});

// Create an index that automatically deletes expired tokens from MongoDB
// This is a "TTL index" (Time To Live)
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetToken = mongoose.model<IPasswordResetToken>('PasswordResetToken', passwordResetTokenSchema);

export default PasswordResetToken;