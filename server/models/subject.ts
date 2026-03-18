import mongoose, { Schema, Types } from "mongoose";

export interface ISubject {
    code: string;
    name: string;
    prerequisites: Types.ObjectId[];
    corequisites: Types.ObjectId[];
    creditHours: number;
}

const subjectSchema = new Schema<ISubject>({
    code: { type: String, required: true },
    name: { type: String, required: true },
    prerequisites: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    corequisites: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    creditHours: { type: Number, required: true },
});

export const Subject = mongoose.model<ISubject>("Subject", subjectSchema);