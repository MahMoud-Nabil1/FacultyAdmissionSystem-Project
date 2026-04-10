import { Request, Response } from 'express';
import { Student } from '../models/student';
import nodemailer from 'nodemailer';
import { UserPayload } from '../middleware/authMiddleware';

/**
 * Helper to safely access req.user with our specific structure
 */
const getUser = (req: Request) => req.user as UserPayload;

export const createStudent = async (req: Request, res: Response): Promise<void> => {
    try {
        const student = new Student(req.body);
        // Using the virtual setter
        (student as any).password = req.body.password;

        await student.save();
        res.status(201).json(student);
    } catch (err: any) {
        if (err.code === 11000) {
            res.status(409).json({
                error: "طالب بنفس الكود أو الإيميل موجود بالفعل"
            });
            return;
        }
        res.status(400).json({ error: err.message });
    }
};

export const getAllStudents = async (_req: Request, res: Response): Promise<void> => {
    try {
        const students = await Student
            .find()
            .populate('department completedSubjects requestedSubjects academicAdvisor', 'name email');

        res.json(students);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getStudentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = getUser(req);

        if (user?.role === 'student' && String(user.id) !== req.params.id) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }

        const student = await Student
            .findById(req.params.id)
            .populate({
                path: "completedSubjects",
                select: "code name creditHours"
            })
            .populate({
                path: "requestedSubjects",
                select: "code name creditHours"
            })
            .populate({
                path: "department",
                select: "name"
            })
            .populate({
                path: "academicAdvisor",
                select: "name email"
            });

        if (!student) {
            res.status(404).json({ error: "Student not found" });
            return;
        }

        // Calculate derived fields
        const completedHours = student.completedSubjects
            .reduce((sum: number, subj: any) => sum + (subj.creditHours || 0), 0);

        const registeredHours = student.requestedSubjects
            .reduce((sum: number, subj: any) => sum + (subj.creditHours || 0), 0);

        // Calculate level based on completed hours
        let level = '1';
        if (completedHours >= 90) level = '4';
        else if (completedHours >= 60) level = '3';
        else if (completedHours >= 30) level = '2';

        res.json({
            ...student.toObject(),
            completedHours,
            registeredHours,
            level,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateStudent = async (req: Request, res: Response): Promise<void> => {
    try {
        const student = await Student.findOne({ _id: req.params.id });

        if (!student) {
            res.status(404).json({ error: "Student not found" });
            return;
        }

        Object.assign(student, req.body);

        if (req.body.password) {
            (student as any).password = req.body.password;
        }

        await student.save();
        res.json(student);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
    try {
        const student = await Student.findOneAndDelete({ _id: req.params.id });

        if (!student) {
            res.status(404).json({ error: "Student not found" });
            return;
        }

        res.json({ message: "Deleted successfully" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const contactIT = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentCode, subjectName, message, replyEmail } = req.body;

        if (!subjectName || !subjectName.trim()) {
            res.status(400).json({ error: "موضوع المشكلة مطلوب." });
            return;
        }

        const student = await Student.findOne({ studentId: studentCode });
        if (!student) {
            res.status(404).json({ error: "كود الطالب غير موجود." });
            return;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.ADMIN_EMAIL,
                pass: process.env.ADMIN_EMAIL_PASS
            }
        });

        const mailOptions = {
            from: replyEmail,
            to: process.env.IT_EMAIL,
            subject: `[IT Support] ${subjectName} - Student: ${studentCode}`,
            text: `طلب دعم فني:\nكود الطالب: ${studentCode}\nالموضوع: ${subjectName}\nالبريد: ${replyEmail}\n\nالمشكلة:\n${message}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "تم الإرسال بنجاح." });
    } catch (err: any) {
        res.status(500).json({ error: "خطأ في السيرفر: " + err.message });
    }
};

export const contactAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentCode, subjectName, message, replyEmail } = req.body;

        if (!subjectName || !subjectName.trim()) {
            res.status(400).json({ error: "كود المقرر مطلوب للإدارة." });
            return;
        }

        const student = await Student.findOne({ studentId: studentCode });
        if (!student) {
            res.status(404).json({ error: "كود الطالب غير موجود." });
            return;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.ADMIN_EMAIL,
                pass: process.env.ADMIN_EMAIL_PASS
            }
        });

        const mailOptions = {
            from: replyEmail,
            to: process.env.ADMIN_EMAIL,
            subject: `[Admin] Course: ${subjectName} - Student: ${studentCode}`,
            text: `طلب إداري:\nكود الطالب: ${studentCode}\nكود المقرر: ${subjectName}\nالبريد: ${replyEmail}\n\nالرسالة:\n${message}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "تم الإرسال بنجاح." });
    } catch (err: any) {
        res.status(500).json({ error: "خطأ في السيرفر: " + err.message });
    }
};
export const getRegistrationStats = async (_req: Request, res: Response): Promise<void> => {
    try {
        const totalStudents = await Student.countDocuments();
        const finishedRegistration = await Student.countDocuments({
            requestedSubjects: { $exists: true, $not: { $size: 0 } }
        });
        const didNotFinishRegistration = totalStudents - finishedRegistration;

        res.json({ totalStudents, finishedRegistration, didNotFinishRegistration });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getMyAcademicHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = getUser(req);


        const student = await Student
            .findOne({ studentId: Number(user.id) })
            .populate('completedSubjects');

        if (!student) {
            res.status(404).json({ error: "Student not found" });
            return;
        }

        res.json(student.completedSubjects);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const assignAcademicAdvisor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { advisorId } = req.body;

        if (!advisorId) {
            res.status(400).json({ error: "Academic advisor ID is required" });
            return;
        }

        const student = await Student.findByIdAndUpdate(
            req.params.id,
            { academicAdvisor: advisorId },
            { new: true }
        ).populate('academicAdvisor', 'name email');

        if (!student) {
            res.status(404).json({ error: "Student not found" });
            return;
        }

        res.json(student);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getMyAdvisees = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = getUser(req);

        if (!user?.id) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        const students = await Student
            .find({ academicAdvisor: user.id })
            .populate('completedSubjects', 'creditHours')
            .populate('department', 'name')
            .sort({ name: 1 });

        // Calculate derived fields for each student
        const result = students.map(student => {
            const completedHours = student.completedSubjects
                .reduce((sum: number, subj: any) => sum + (subj.creditHours || 0), 0);

            // Calculate level based on completed hours
            let level = '1';
            if (completedHours >= 90) level = '4';
            else if (completedHours >= 60) level = '3';
            else if (completedHours >= 30) level = '2';

            return {
                _id: student._id,
                studentId: student.studentId,
                name: student.name,
                email: student.email,
                gpa: student.gpa,
                completedHours,
                level,
            };
        });

        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
