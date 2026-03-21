import mongoose, { Schema } from 'mongoose';

const complaintSchema = new Schema({
    studentName: { type: String, required: true },
    studentId: { type: String, required: true },
    courseName: { type: String, required: true },
    withdrawalReason: { type: String, required: true },
    complaintText: { type: String, required: true },
    status: { type: String, default: 'pending' },
    adminResponse: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Complaint', complaintSchema);