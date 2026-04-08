import { Request, Response } from "express";
import { Subject } from "../models/subject";
import { Student } from "../models/student";
import { Settings } from "../models/announcement";
import mongoose from "mongoose";
import { getStudentLevelFromHours } from "../utils/enrollment.utils";

export const createSubject = async (req: Request, res: Response): Promise<void> => {
    try {
        const subject = new Subject(req.body);
        await subject.save();
        res.status(201).json(subject);
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message });
        } else {
            res.status(400).json({ error: "Unknown error" });
        }
    }
};

export const getAllSubjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const subjects = await Subject.find().populate("prerequisites").populate("corequisites");
        res.json(subjects);
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(500).json({ error: "Unknown error" });
        }
    }
};

export const getSubjectById = async (req: Request, res: Response): Promise<void> => {
    try {
        const subject = await Subject.findById(req.params.id).populate("prerequisites").populate("corequisites");

        if (!subject) {
            res.status(404).json({ error: "Subject not found" });
            return;
        }

        res.json(subject);
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(500).json({ error: "Unknown error" });
        }
    }
};

export const updateSubject = async (req: Request, res: Response): Promise<void> => {
    try {
        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate("prerequisites").populate("corequisites");

        if (!subject) {
            res.status(404).json({ error: "Subject not found" });
            return;
        }

        res.json(subject);
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message });
        } else {
            res.status(400).json({ error: "Unknown error" });
        }
    }
};

export const deleteSubject = async (req: Request, res: Response): Promise<void> => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);

        if (!subject) {
            res.status(404).json({ error: "Subject not found" });
            return;
        }

        res.json({ message: "Deleted successfully" });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(500).json({ error: "Unknown error" });
        }
    }
};

export const getEligibleSubjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = (req as any).user?.id;

        if (!studentId) {
            res.status(401).json({ error: "Authentication required" });
            return;
        }

        const student = await Student.findOne({ studentId: Number(studentId) });
        if (!student) {
            res.status(404).json({ error: "Student not found" });
            return;
        }

        const settings = await Settings.findOne();
        if (!settings) {
            res.status(500).json({ error: "Settings not configured" });
            return;
        }

        // Calculate student's level from completed credit hours
        const studentLevel = await getStudentLevelFromHours(student._id);

        const allSubjects = await Subject.find().populate("prerequisites").populate("corequisites");

        const completedIds = new Set(student.completedSubjects.map((id: mongoose.Types.ObjectId) => id.toString()));

        const eligibleSubjects = allSubjects.filter((subject) => {
            // Check prerequisites
            const prereqsMet = subject.prerequisites.every(
                (prereq: any) => completedIds.has(typeof prereq === "object" ? prereq._id.toString() : prereq.toString())
            );

            // Check GPA range
            const gpaValid = student.gpa >= settings.gpaMin && student.gpa <= settings.gpaMax;

            // Check level: subject must be <= student's level AND available this semester
            const subjectLevelNum = parseInt(subject.level);
            const studentLevelNum = parseInt(studentLevel);
            const levelValid = subjectLevelNum <= studentLevelNum && settings.level.includes(subject.level);

            return prereqsMet && gpaValid && levelValid;
        });

        res.json(eligibleSubjects);
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(500).json({ error: "Unknown error" });
        }
    }
};