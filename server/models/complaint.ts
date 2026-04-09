import mongoose, { Schema } from 'mongoose';

const complaintSchema = new Schema({
    studentName: { type: String, required: true },
    studentId: { type: String, required: true },
    requestType: { type: String, required: true }, // Student writes freely
    courseName: { type: String, required: true },
    problemDescription: { type: String, required: true },
    additionalDetails: { type: String, default: '' },
    status: { type: String, default: 'pending' },
    adminResponse: { type: String, default: '' },
    adminNotes: { type: String, default: '' },
    reviewedBy: { type: String, default: '' },
    reviewedAt: Date
}, { timestamps: true });

export default mongoose.model('Complaint', complaintSchema);