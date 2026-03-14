import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface representing the Department document
 */
export interface IDepartment extends Document {
    id: string;
    name: string;
    subjects: mongoose.Types.ObjectId[];
}

const departmentSchema = new Schema<IDepartment>({
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
    subjects: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Subject'
        }
    ]
});

const Department = mongoose.model<IDepartment>('Department', departmentSchema);

export default Department;