import mongoose, { Schema, Types, HydratedDocument } from "mongoose";
import bcrypt from "bcrypt";

export interface IStudent {
    studentId: number;
    name: string;
    email?: string | null;
    hash?: string;
    salt?: string;
    gpa: number;
    completedSubjects: Types.ObjectId[];
    requestedSubjects: Types.ObjectId[];
    department?: Types.ObjectId;
    currentSessionId?: string | null;
    _password?: string;
    verifyPassword(password: string): Promise<boolean>;
}

export type StudentDocument = HydratedDocument<IStudent>;

const studentSchema = new Schema<IStudent>(
    {
        studentId: {
            type: Number,
            required: [true, "Student ID is required"],
            unique: true,
        },

        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            sparse: true,
            default: null,
            unique: true,
        },

        hash: {
            type: String,
            select: false,
        },

        salt: {
            type: String,
            select: false,
        },

        gpa: {
            type: Number,
            default: 0.0,
            min: 0,
            max: 5,
        },

        completedSubjects: [
            { type: Schema.Types.ObjectId, ref: "Subject" },
        ],

        requestedSubjects: [
            { type: Schema.Types.ObjectId, ref: "Subject" },
        ],

        department: {
            type: Schema.Types.ObjectId,
            ref: "Department",
        },
        currentSessionId: {
            type: String,
            default: null,
        },
    },
        { timestamps: true }
);

studentSchema.virtual("password").set(function (this: StudentDocument, password: string) {
    this._password = password;
});

studentSchema.pre("save", async function (this: StudentDocument) {
    if (!this._password || !this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.salt = salt;
    this.hash = await bcrypt.hash(this._password, salt);
});

studentSchema.pre("validate", function (this: StudentDocument) {
    if (this.isNew && !this._password) {
        this.invalidate("password", "Password is required");
    }
});

studentSchema.methods.verifyPassword = function (
this: StudentDocument,
    password: string
) {
    return bcrypt.compare(password, this.hash as string);
};

export const Student = mongoose.model<IStudent>("Student", studentSchema);
export default Student;