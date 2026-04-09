import mongoose, { Schema, Types } from "mongoose";

export interface ISubject {
    code: string;
    name: string;
    level: '1' | '2' | '3' | '4';
    prerequisites: Types.ObjectId[];
    corequisites: Types.ObjectId[];
    creditHours: number;
}

const subjectSchema = new Schema<ISubject>({
    code: { type: String, required: true },
    name: { type: String, required: true },
    level: { type: String, required: true, enum: ['1', '2', '3', '4'] },
    prerequisites: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    corequisites: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    creditHours: { type: Number, required: true },
});

export const Subject = mongoose.model<ISubject>("Subject", subjectSchema);