import mongoose, { Schema, Document } from 'mongoose';

export type RequestStatus =
    | 'pending'
    | 'processing'
    | 'approved'
    | 'rejected';

export interface IEnrollmentRequest extends Document {
    student: mongoose.Types.ObjectId;
    group: mongoose.Types.ObjectId;
    status: RequestStatus;
    createdAt: Date;
    updatedAt: Date;
}

const enrollmentRequestSchema = new Schema<IEnrollmentRequest>({
    student: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'approved', 'rejected'],
        default: 'pending',
    },
}, {
    timestamps: true,
});

// Compound index to ensure a student can only have one pending request per group
enrollmentRequestSchema.index(
    { student: 1, group: 1 },
    {
        unique: true,
        partialFilterExpression: { status: 'pending' }
    }
);

// Index for efficient querying of pending requests in order
enrollmentRequestSchema.index({ group: 1, status: 1, createdAt: 1 });

export const EnrollmentRequest = mongoose.model<IEnrollmentRequest>('EnrollmentRequest', enrollmentRequestSchema);
