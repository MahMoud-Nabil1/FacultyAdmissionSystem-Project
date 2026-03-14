import { Request, Response } from 'express';
import { Group } from '../models/group';
import { Student } from '../models/student';
import Staff, { IStaff } from '../models/staff';
import { UserPayload } from '../middleware/authMiddleware';

/**
 * canManageStudent is true when staff has write permissions for a specific student
 */
async function canManageStudent(staff: IStaff, studentId: string): Promise<boolean> {
    // Admins can manage anyone
    if (staff.role === 'admin') return true;

    // Academic guide: only assigned students
    if (staff.role === 'academic_guide') {
        return staff.students.some(sId => sId.toString() === studentId.toString());
    }

    // Academic guide coordinator: all students in coordinator's departments
    if (staff.role === 'academic_guide_coordinator') {
        const student = await Student.findById(studentId);
        if (!student || !student.department) return false;

        // Check if student's department is in the staff's departments list
        return staff.departments.some(depId => depId.toString() === student.department?.toString());
    }

    return false;
}

export const createGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const group = new Group(req.body);
        await group.save();
        res.status(201).json(group);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const getAllGroups = async (_req: Request, res: Response): Promise<void> => {
    try {
        const groups = await Group.find().populate('students');
        res.json(groups);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getGroupById = async (req: Request, res: Response): Promise<void> => {
    try {
        const group = await Group.findById(req.params.id).populate('students');
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        res.json(group);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('students');

        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        res.json(group);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const group = await Group.findByIdAndDelete(req.params.id);
        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }
        res.json({ message: 'Group deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const addStudentToGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.body;
        const user = req.user as UserPayload;
        const group = await Group.findById(req.params.id);

        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }

        // Permission Check
        if (user.role !== 'admin') {
            const staff = await Staff.findById(user.id);
            if (!staff) {
                res.status(404).json({ error: "Staff not found" });
                return;
            }
            const allowed = await canManageStudent(staff, studentId);
            if (!allowed) {
                res.status(403).json({ error: "Forbidden: cannot manage this student" });
                return;
            }
        }

        // Capacity Check (Admins and Coordinators can bypass)
        const isPrivileged = user.role === 'admin' || user.role === 'academic_guide_coordinator';
        if (group.students.length >= group.capacity && !isPrivileged) {
            res.status(400).json({ error: 'Group has reached maximum capacity' });
            return;
        }

        // Duplication Check
        if (group.students.map(id => id.toString()).includes(studentId)) {
            res.status(400).json({ error: 'Student already in this group' });
            return;
        }

        group.students.push(studentId);
        await group.save();

        const updatedGroup = await Group.findById(req.params.id).populate('students');
        res.json(updatedGroup);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const removeStudentFromGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }

        group.students = group.students.filter(id => id.toString() !== studentId) as any;
        await group.save();

        const updatedGroup = await Group.findById(req.params.id).populate('students');
        res.json(updatedGroup);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const addSelfToGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as UserPayload;
        if (user.role !== 'student') {
            res.status(403).json({ error: "Forbidden: Only students can enroll themselves" });
            return;
        }

        const group = await Group.findById(req.params.id);
        if (!group) {
            res.status(404).json({ error: "Group not found" });
            return;
        }

        const studentId = user.id;

        if (group.students.map(id => id.toString()).includes(studentId)) {
            res.status(400).json({ error: "You are already in this group" });
            return;
        }

        if (group.students.length >= group.capacity) {
            res.status(400).json({ error: "Group has reached maximum capacity" });
            return;
        }

        group.students.push(studentId as any);
        await group.save();

        const updatedGroup = await Group.findById(req.params.id).populate('students');
        res.json(updatedGroup);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const removeSelfFromGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as UserPayload;
        if (user.role !== 'student') {
            res.status(403).json({ error: "Forbidden: Only students can remove themselves" });
            return;
        }

        const group = await Group.findById(req.params.id);
        if (!group) {
            res.status(404).json({ error: "Group not found" });
            return;
        }

        const studentId = user.id;
        group.students = group.students.filter(id => id.toString() !== studentId) as any;
        await group.save();

        const updatedGroup = await Group.findById(req.params.id).populate('students');
        res.json(updatedGroup);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const getGroupsByDay = async (req: Request, res: Response): Promise<void> => {
    try {
        const groups = await Group.find({ day: req.params.day }).populate('students');
        res.json(groups);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getGroupsByType = async (req: Request, res: Response): Promise<void> => {
    try {
        const groups = await Group.find({ type: req.params.type }).populate('students');
        res.json(groups);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};