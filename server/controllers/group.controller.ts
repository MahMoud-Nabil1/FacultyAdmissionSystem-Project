import { Request, Response } from 'express';
import { Group } from '../models/group';
import { Student } from '../models/student';
import { Subject } from '../models/subject';
import Staff, { IStaff } from '../models/staff';
import { EnrollmentRequest } from '../models/enrollmentRequest';
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

export const requestJoinGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user as UserPayload;
        if (user.role !== 'student') {
            res.status(403).json({ error: "Forbidden: Only students can request to join groups" });
            return;
        }

        const group = await Group.findById(req.params.id);
        if (!group) {
            res.status(404).json({ error: "Group not found" });
            return;
        }

        // Look up the student's MongoDB _id from the numeric studentId in the JWT
        const student = await Student.findOne({ studentId: Number(user.id) });
        if (!student) {
            res.status(404).json({ error: "Student not found" });
            return;
        }
        const studentObjectId = student._id.toString();

        // Check if already enrolled in the group
        if (group.students.map(id => id.toString()).includes(studentObjectId)) {
            res.status(400).json({ error: "You are already in this group" });
            return;
        }

        // Check if there's already a pending request
        const existingRequest = await EnrollmentRequest.findOne({
            student: student._id,
            group: group._id,
            status: 'pending',
        });
        if (existingRequest) {
            res.status(400).json({ error: "You already have a pending request for this group" });
            return;
        }

        // Create the enrollment request
        const enrollmentRequest = new EnrollmentRequest({
            student: student._id,
            group: group._id,
            status: 'pending',
        });
        await enrollmentRequest.save();

        res.status(201).json({
            message: "Request submitted successfully",
            request: enrollmentRequest,
        });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
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

export const processEnrollmentRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { requestId } = req.params;
        const { action } = req.body; // 'approve' or 'reject'
        const user = req.user as UserPayload;

        if (!['approve', 'reject'].includes(action)) {
            res.status(400).json({ error: "Invalid action. Use 'approve' or 'reject'" });
            return;
        }

        const request = await EnrollmentRequest.findById(requestId).populate('group');
        if (!request) {
            res.status(404).json({ error: "Request not found" });
            return;
        }

        if (request.status !== 'pending') {
            res.status(400).json({ error: "Request has already been processed" });
            return;
        }

        const group = await Group.findById(request.group._id);
        if (!group) {
            res.status(404).json({ error: "Group not found" });
            return;
        }

        // Permission check
        if (user.role !== 'admin' && user.role !== 'academic_guide_coordinator') {
            const staff = await Staff.findById(user.id);
            if (!staff || staff.role !== 'academic_guide_coordinator') {
                res.status(403).json({ error: "Forbidden: Cannot process this request" });
                return;
            }
        }

        if (action === 'approve') {
            // Check capacity
            if (group.students.length >= group.capacity) {
                request.status = 'rejected';
                await request.save();
                res.status(400).json({ error: "Group has reached maximum capacity", request });
                return;
            }

            // Add student to group
            group.students.push(request.student as any);
            await group.save();

            // Track subject in student.requestedSubjects
            const student = await Student.findById(request.student);
            if (student) {
                const subjectDoc = await Subject.findOne({ code: new RegExp(`^${group.subject}$`, 'i') });
                if (subjectDoc) {
                    const alreadyRequested = student.requestedSubjects
                        .map((id: any) => id.toString())
                        .includes(subjectDoc._id.toString());
                    if (!alreadyRequested) {
                        student.requestedSubjects.push(subjectDoc._id as any);
                        await student.save();
                    }
                }
            }

            request.status = 'approved';
            await request.save();
        } else {
            request.status = 'rejected';
            await request.save();
        }

        const updatedGroup = await Group.findById(group._id).populate('students');
        res.json({ request, group: updatedGroup });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
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

        const student = await Student.findOne({ studentId: Number(user.id) });
        if (!student) {
            res.status(404).json({ error: "Student not found" });
            return;
        }
        const studentObjectId = student._id.toString();

        group.students = group.students.filter(id => id.toString() !== studentObjectId) as any;
        await group.save();

        // Also cancel any pending requests for this group
        await EnrollmentRequest.deleteMany({
            student: student._id,
            group: group._id,
            status: 'pending',
        });

        // Try to remove subject from student.requestedSubjects if no more groups for this subject
        try {
            const subjectCode = group.subject.toLowerCase();
            const otherGroups = await Group.find({
                _id: { $ne: group._id },
                students: student._id
            });
            const stillEnrolledInSubject = otherGroups.some(
                g => g.subject.toLowerCase() === subjectCode
            );
            if (!stillEnrolledInSubject) {
                const subjectDoc = await Subject.findOne({
                    code: { $regex: new RegExp(`^${subjectCode}$`, 'i') }
                });
                if (subjectDoc) {
                    student.requestedSubjects = student.requestedSubjects.filter(
                        (id: any) => id.toString() !== subjectDoc._id.toString()
                    ) as any;
                    await student.save();
                }
            }
        } catch (cleanupErr) {
            console.error("Warning: failed to clean up requestedSubjects:", cleanupErr);
        }

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