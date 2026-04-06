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
            .populate('department completedSubjects requestedSubjects');

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
            });

        if (!student) {
            res.status(404).json({ error: "Student not found" });
            return;
        }

        res.json(student);
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
