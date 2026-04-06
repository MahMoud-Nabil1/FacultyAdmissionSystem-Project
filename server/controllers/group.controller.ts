import { Request, Response } from 'express';
import { Group } from '../models/group';
import { Student } from '../models/student';
import { Subject } from '../models/subject';
import Staff, { IStaff } from '../models/staff';
import { EnrollmentRequest } from '../models/enrollmentRequest';
import { UserPayload } from '../middleware/authMiddleware';
import mongoose from "mongoose";
import { ensureSubjectRequested, hasTimeCollision } from '../utils/enrollment.utils';
import SystemSetting from '../models/systemSetting';

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
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {

            const { studentId } = req.body;
            const user = req.user as UserPayload;

            const group = await Group.findById(req.params.id).session(session);

            if (!group) {
                throw new Error("Group not found");
            }

            // Permission check
            if (user.role !== 'admin') {
                const staff = await Staff.findById(user.id);
                if (!staff) throw new Error("Staff not found");

                const allowed = await canManageStudent(staff, studentId);
                if (!allowed) throw new Error("Forbidden: cannot manage this student");
            }

            const isPrivileged =
                user.role === 'admin' || user.role === 'academic_guide_coordinator';

            if (group.students.length >= group.capacity && !isPrivileged) {
                throw new Error("Group has reached maximum capacity");
            }

            if (group.students.map(id => id.toString()).includes(studentId)) {
                throw new Error("Student already in this group");
            }

            // Add student to group
            group.students.push(new mongoose.Types.ObjectId(studentId));
            await group.save({ session });

            await ensureSubjectRequested(studentId, group.subject, session);
        });

        const updatedGroup = await Group.findById(req.params.id).populate("students");
        res.json(updatedGroup);

    } catch (err: any) {
        res.status(400).json({ error: err.message });
    } finally {
        await session.endSession();
    }
};

async function updateStudentSubjectsOnRemoval(studentId: string | mongoose.Types.ObjectId, groupId: string | mongoose.Types.ObjectId, subjectCode: string, session: mongoose.ClientSession) {
    const otherGroupsForSubject = await Group.findOne({
        subject: { $regex: new RegExp(`^${subjectCode}$`, 'i') },
        students: studentId,
        _id: { $ne: groupId }
    }).session(session);

    if (!otherGroupsForSubject) {
        const subjectDoc = await Subject.findOne({
            code: { $regex: new RegExp(`^${subjectCode}$`, 'i') }
        }).session(session);

        if (subjectDoc) {
            await Student.findByIdAndUpdate(studentId, {
                $pull: { requestedSubjects: subjectDoc._id }
            }, { session });
        }
    }
}

export const removeStudentFromGroup = async (req: Request, res: Response) => {
    const studentId = req.query.studentId as string;
    const groupId = req.params.id as string;

    if (!studentId) return res.status(400).json({ error: "studentId is required" });

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const group = await Group.findByIdAndUpdate(
                groupId,
                { $pull: { students: studentId } },
                { session, new: true }
            );
            if (!group) throw new Error("Group not found");

            await updateStudentSubjectsOnRemoval(studentId, group._id, group.subject, session);
            await EnrollmentRequest.deleteMany({ student: studentId, group: groupId, status: 'pending' }, { session });
            await processNextInWaitlist(groupId, session);
        });

        res.json({ message: 'Student removed successfully' });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    } finally {
        await session.endSession();
    }
};

export const removeSelfFromGroup = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    const groupId = req.params.id as string;

    try {
        await session.withTransaction(async () => {
            const settings = await SystemSetting.findOne().session(session);
            if (settings && !settings.withdrawalOpen) {
                throw new Error("Withdrawal is currently closed");
            }

            const user = req.user as UserPayload;
            const student = await Student.findOne({ studentId: Number(user.id) }).session(session);

            if (!student) throw new Error("Student not found");

            const group = await Group.findByIdAndUpdate(
                groupId,
                { $pull: { students: student._id } },
                { session, new: true }
            );

            if (!group) throw new Error("Group not found");

            await updateStudentSubjectsOnRemoval(student._id as mongoose.Types.ObjectId, group._id, group.subject, session);

            await EnrollmentRequest.deleteMany({
                student: student._id,
                group: group._id,
                status: 'pending'
            }, { session });

            await processNextInWaitlist(groupId, session);
        });

        res.json({ message: "Successfully removed and waitlist processed." });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    } finally {
        await session.endSession();
    }
};

export const getMyRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as UserPayload;
        if (user.role !== 'student') {
            res.status(403).json({ error: "Forbidden: Only students can view their requests" });
            return;
        }

        const student = await Student.findOne({ studentId: Number(user.id) });
        if (!student) {
            res.status(404).json({ error: "Student not found" });
            return;
        }

        const requests = await EnrollmentRequest.find({ student: student._id })
            .populate('group')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getPendingRequestsForGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as UserPayload;
        const group = await Group.findById(req.params.id);
        if (!group) {
            res.status(404).json({ error: "Group not found" });
            return;
        }

        // Permission check - only staff with manage permissions can view
        if (user.role !== 'admin' && user.role !== 'academic_guide_coordinator') {
            const staff = await Staff.findById(user.id);
            if (!staff || staff.role !== 'academic_guide_coordinator') {
                res.status(403).json({ error: "Forbidden: Cannot view requests for this group" });
                return;
            }
        }

        const requests = await EnrollmentRequest.find({
            group: group._id,
            status: 'pending',
        })
            .populate('student')
            .sort({ createdAt: 1 }); // FIFO order
        res.json(requests);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const cancelMyRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as UserPayload;
        const { requestId } = req.params;

        const request = await EnrollmentRequest.findById(requestId);
        if (!request) {
            res.status(404).json({ error: "Request not found" });
            return;
        }

        const student = await Student.findOne({ studentId: Number(user.id) });
        if (!student || request.student.toString() !== student._id.toString()) {
            res.status(403).json({ error: "Forbidden: Cannot cancel this request" });
            return;
        }

        if (request.status !== 'pending') {
            res.status(400).json({ error: "Cannot cancel a processed request" });
            return;
        }

        await EnrollmentRequest.findByIdAndDelete(requestId);
        res.json({ message: "Request cancelled successfully" });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

// Helper function to process the next person in line
async function processNextInWaitlist(groupId: string, session: mongoose.ClientSession) {
    const pendingRequests = await EnrollmentRequest.find({ group: groupId, status: 'pending' })
        .sort({ createdAt: 1 })
        .session(session);

    if (pendingRequests.length === 0) return;

    const group = await Group.findById(groupId).session(session);
    if (!group) return;

    for (const request of pendingRequests) {
        if (group.students.length >= group.capacity) break;

        const collision = await hasTimeCollision(request.student, group, session);

        if (collision) {
            request.status = 'rejected';
            await request.save({ session });
            continue; // Move to next person in waitlist
        }

        // Enroll the student
        await Group.findByIdAndUpdate(groupId, { $addToSet: { students: request.student } }, { session });
        request.status = 'approved';
        await request.save({ session });

        // Update student's requested subjects if needed
        await ensureSubjectRequested(request.student, group.subject, session);
    }
}

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

