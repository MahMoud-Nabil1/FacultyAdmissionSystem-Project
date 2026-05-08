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

        // Aggregate all students with their completed hours, registered hours, and GPA
        const allStudents = await Student.aggregate([
            {
                $lookup: {
                    from: "subjects",
                    localField: "completedSubjects",
                    foreignField: "_id",
                    as: "completedSubjectsDetails"
                }
            },
            {
                $lookup: {
                    from: "subjects",
                    localField: "requestedSubjects",
                    foreignField: "_id",
                    as: "requestedSubjectsDetails"
                }
            },
            {
                $addFields: {
                    completedHours: { $sum: "$completedSubjectsDetails.creditHours" },
                    registeredHours: { $sum: "$requestedSubjectsDetails.creditHours" }
                }
            },
            {
                $addFields: {
                    level: {
                        $switch: {
                            branches: [
                                { case: { $gte: ["$completedHours", 90] }, then: "4" },
                                { case: { $gte: ["$completedHours", 60] }, then: "3" },
                                { case: { $gte: ["$completedHours", 30] }, then: "2" },
                            ],
                            default: "1"
                        }
                    },
                    finishedRegistration: { $gte: ["$registeredHours", 14] }
                }
            }
        ]);

        // Overall finished/not finished
        const finishedRegistration = allStudents.filter(s => s.finishedRegistration).length;
        const didNotFinishRegistration = totalStudents - finishedRegistration;

        // Per-level breakdown
        const levels = ["1", "2", "3", "4"];
        const byLevel = levels.map(level => {
            const levelStudents = allStudents.filter(s => s.level === level);
            const total = levelStudents.length;
            const finished = levelStudents.filter(s => s.finishedRegistration).length;
            const notFinished = total - finished;
            const gpas = levelStudents.map(s => s.gpa || 0);
            const avgGpa = total > 0
                ? Math.round((gpas.reduce((a, b) => a + b, 0) / total) * 100) / 100
                : 0;
            return { level, total, finished, notFinished, avgGpa };
        });

        // GPA distribution buckets (0-1, 1-2, 2-3, 3-4, 4-5)
        const gpaDistribution = [
            { range: "0–1", count: allStudents.filter(s => s.gpa >= 0 && s.gpa < 1).length },
            { range: "1–2", count: allStudents.filter(s => s.gpa >= 1 && s.gpa < 2).length },
            { range: "2–3", count: allStudents.filter(s => s.gpa >= 2 && s.gpa < 3).length },
            { range: "3–4", count: allStudents.filter(s => s.gpa >= 3 && s.gpa < 4).length },
            { range: "4–5", count: allStudents.filter(s => s.gpa >= 4 && s.gpa <= 5).length },
        ];

        // Overall average GPA
        const allGpas = allStudents.map(s => s.gpa || 0);
        const avgGpa = totalStudents > 0
            ? Math.round((allGpas.reduce((a, b) => a + b, 0) / totalStudents) * 100) / 100
            : 0;

        res.json({
            totalStudents,
            finishedRegistration,
            didNotFinishRegistration,
            avgGpa,
            byLevel,
            gpaDistribution,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getMyAcademicHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = getUser(req);
        console.log("getMyAcademicHistory - User:", user);
        console.log("getMyAcademicHistory - User ID:", user.id);

        const student = await Student
            .findOne({ studentId: Number(user.id) })
            .populate({
                path: 'academicHistory.subject',
                select: 'code name creditHours'
            });

        console.log("getMyAcademicHistory - Student found:", student ? 'Yes' : 'No');
        console.log("getMyAcademicHistory - Academic History length:", student?.academicHistory?.length || 0);

        if (!student) {
            res.status(404).json({ error: "Student not found" });
            return;
        }

        // Helper function to convert degree to grade letter
        const getGrade = (degree: number): string => {
            if (degree >= 90) return 'A+';
            if (degree >= 85) return 'A';
            if (degree >= 80) return 'B+';
            if (degree >= 75) return 'B';
            if (degree >= 70) return 'C+';
            if (degree >= 65) return 'C';
            if (degree >= 60) return 'D+';
            if (degree >= 50) return 'D';
            return 'F';
        };

        // Helper function to convert degree to GPA (4.0 scale)
        const getGPA = (degree: number): number => {
            let gpa = (degree - 50) / 10
            if (gpa < 0) gpa = 0;
            if (gpa > 5) gpa = 5;
            return gpa;
        };

        // Transform academic history to match frontend expectations
        const academicHistory = student.academicHistory.map((entry: any) => ({
            s_code: entry.subject?.code || 'Unknown',
            s_name: entry.subject?.name || 'Unknown',
            c_hours: entry.subject?.creditHours || 0,
            degree: entry.degree,
            rate: getGrade(entry.degree),
            gpa: getGPA(entry.degree),
        }));

        console.log("getMyAcademicHistory - Returning", academicHistory.length, "records");
        res.json(academicHistory);
    } catch (err: any) {
        console.error("getMyAcademicHistory - ERROR:", err);
        console.error("getMyAcademicHistory - Stack:", err.stack);
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
