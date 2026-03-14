import { Request, Response } from 'express';
import Department from '../models/department';

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const department = new Department(req.body);
        await department.save();
        res.status(201).json(department);
    } catch (err: any) {
        if (err.code === 11000) {
            res.status(409).json({
                error: "قسم بنفس الكود موجود بالفعل"
            });
            return;
        }
        res.status(400).json({ error: err.message });
    }
};

export const getAllDepartments = async (_req: Request, res: Response): Promise<void> => {
    try {
        const departments = await Department
            .find()
            .populate('subjects');

        res.json(departments);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const department = await Department
            .findOne({ id: req.params.id })
            .populate('subjects');

        if (!department) {
            res.status(404).json({ error: "القسم غير موجود" });
            return;
        }

        res.json(department);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department) {
            res.status(404).json({ error: "القسم غير موجود" });
            return;
        }

        Object.assign(department, req.body);

        await department.save();
        res.json(department);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);

        if (!department) {
            res.status(404).json({ error: "القسم غير موجود" });
            return;
        }

        res.json({ message: "تم حذف القسم بنجاح" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};