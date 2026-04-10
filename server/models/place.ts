import mongoose, { Schema } from "mongoose";

export interface IPlace {
    name: string;
    type: 'hall' | 'room' | 'lab' | 'lecture_hall';
    capacity: number;
    building?: string;
    floor?: number;
    isActive: boolean;
}

const placeSchema = new Schema<IPlace>({
    name: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ['hall', 'room', 'lab', 'lecture_hall'] },
    capacity: { type: Number, required: true, min: 1 },
    building: { type: String },
    floor: { type: Number },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true
});

export const Place = mongoose.model<IPlace>("Place", placeSchema);
