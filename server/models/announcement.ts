import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
    title: string;
    content: string;
    author: string;
    createdAt: Date;
    updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        default: 'Admin'
    }
}, {
    timestamps: true
});

export type LevelType = '1' | '2' | '3' | '4';

export interface ISettings extends Document {
    gpaMin: number;
    gpaMax: number;
    level: LevelType[];
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>({
    gpaMin: {
        type: Number,
        required: true,
        default: 2.5,
        min: 0,
        max: 5
    },
    gpaMax: {
        type: Number,
        required: true,
        default: 5,
        min: 0,
        max: 5
    },
    level: {
        type: [String],
        required: true,
        default: ['1'],
        enum: ['1', '2', '3', '4']
    },
    updatedBy: {
        type: String,
        default: 'Admin'
    }
}, {
    timestamps: true
});

export const Announcement = mongoose.model<IAnnouncement>('Announcement', announcementSchema);
export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);