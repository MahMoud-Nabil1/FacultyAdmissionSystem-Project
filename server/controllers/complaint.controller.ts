import { Request, Response } from 'express';
import Complaint from '../models/complaint';

export const getComplaints = async (req: Request, res: Response) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const createComplaint = async (req: Request, res: Response) => {
    try {
        const complaint = new Complaint(req.body);
        await complaint.save();
        res.status(201).json(complaint);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const updateComplaint = async (req: Request, res: Response) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        res.json(complaint);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteComplaint = async (req: Request, res: Response) => {
    try {
        const complaint = await Complaint.findByIdAndDelete(req.params.id);
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        res.json({ message: 'Complaint deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};