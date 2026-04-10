import mongoose, { Schema, Document } from 'mongoose';

export type GroupType = 'lecture' | 'lab' | 'tutorial' | 'seminar';
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface IGroup extends Document {
    number: number;
    subject: string; // Course code (e.g., "math110")
    type: GroupType;
    from: number;    // Represents time (e.g., 8 for 8:00 AM)
    to: number;      // Represents time (e.g., 10 for 10:00 AM)
    day: WeekDay;
    students: mongoose.Types.ObjectId[];
    capacity: number;
    createdAt: Date;
    updatedAt: Date;
    place: mongoose.Types.ObjectId;
}

const groupSchema = new Schema<IGroup>({
    number: {
        type: Number,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['lecture', 'lab', 'tutorial', 'seminar']
    },
    from: {
        type: Number,
        required: true,
    },
    to: {
        type: Number,
        required: true,
    },
    day: {
        type: String,
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    students: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Student'
        }
    ],
    capacity: {
        type: Number,
        required: true,
        min: 1
    }
    ,
    place: {
        type: Schema.Types.ObjectId,
        ref: 'Place',
        required: [true, 'Place is required'],
    }
}, {
    timestamps: true
});

// Unique constraint: place must be unique per (day, from, to) combination
groupSchema.index({ day: 1, from: 1, to: 1, place: 1 }, {
    unique: true,
    partialFilterExpression: { place: { $type: "objectId" } }
});

export const Group = mongoose.model<IGroup>('Group', groupSchema);