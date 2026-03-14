import { Request, Response } from "express";
import {Subject} from "../models/subject";

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
        const subjects = await Subject.find().populate("prerequisites");
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
        const subject = await Subject.findById(req.params.id).populate("prerequisites");

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
        ).populate("prerequisites");

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