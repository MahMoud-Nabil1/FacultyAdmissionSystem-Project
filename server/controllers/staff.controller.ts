import { Request, Response } from 'express';
import Staff from '../models/staff';
import { UserPayload } from '../middleware/authMiddleware';

export const createStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const staff = new Staff(req.body);

        if (req.body.password) {
            staff.password = req.body.password;
        }

        await staff.save();
        res.status(201).json(staff);
    } catch (err: any) {
        // Handle duplicate email (MongoDB error code 11000)
        if (err.code === 11000 && err.keyPattern?.email) {
            res.status(409).json({
                error: "يوجد موظف بنفس الإيميل بالفعل"
            });
            return;
        }
        res.status(400).json({ error: err.message });
    }
};

export const getAllStaff = async (_req: Request, res: Response): Promise<void> => {
    try {
        const staffList = await Staff.find().populate('departments students');
        res.json(staffList);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getStaffById = async (req: Request, res: Response): Promise<void> => {
    try {
        const staff = await Staff.findOne({ _id: req.params.id })
            .populate('departments students');

        if (!staff) {
            res.status(404).json({ error: "Staff not found" });
            return;
        }
        res.json(staff);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        // Note: Switched to _id to match standard MongoDB params
        const staff = await Staff.findOne({ _id: req.params.id });
        if (!staff) {
            res.status(404).json({ error: "Staff not found" });
            return;
        }

        Object.assign(staff, req.body);

        if (req.body.password) {
            staff.password = req.body.password;
        }

        await staff.save();
        res.json(staff);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as UserPayload;
        const staffIdToDelete = req.params.id;

        // Security check: Cannot delete self
        if (user && user.id === staffIdToDelete) {
            res.status(400).json({ error: "You cannot delete yourself" });
            return;
        }

        const staff = await Staff.findOneAndDelete({ _id: staffIdToDelete });
        if (!staff) {
            res.status(404).json({ error: "Staff not found" });
            return;
        }

        res.json({ message: "Deleted successfully" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};