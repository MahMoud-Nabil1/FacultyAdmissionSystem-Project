import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Student } from '../models/student';
import Staff from '../models/staff';
import PasswordResetToken from '../models/passwordResetToken';
import { sendPasswordResetEmail } from '../middleware/email';
import { UserPayload } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'faculty-admission-secret-key';
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;
const FACULTY_EMAIL_PREFIX = '20';
const FACULTY_EMAIL_DOMAIN = '@std.sci.cu.edu.eg';
const INVALID_RESET_LINK = 'Invalid or expired reset link';

// Helper to find valid token
async function findValidResetToken(token: string) {
    if (!token) return null;
    const resetDoc = await PasswordResetToken.findOne({ token });
    if (!resetDoc) return null;
    if (new Date() > (resetDoc as any).expiresAt) {
        await PasswordResetToken.deleteOne({ token });
        return null;
    }
    return resetDoc;
}

// --- NEW/RESTORED METHODS ---

export const requestPasswordResetFacultyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const studentId = req.body.studentId != null ? Number(req.body.studentId) : NaN;
        if (isNaN(studentId) || studentId <= 0) {
            res.status(400).json({ error: 'Valid student ID is required' });
            return;
        }

        const student = await Student.findOne({ studentId });
        if (!student) {
            res.json({ message: 'cannot find account with this student ID in the database' });
            return;
        }

        const facultyEmail = `${FACULTY_EMAIL_PREFIX}${studentId}${FACULTY_EMAIL_DOMAIN}`;
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

        await PasswordResetToken.create({
            email: facultyEmail,
            token,
            role: 'student',
            expiresAt,
            studentId
        });

        await sendPasswordResetEmail(facultyEmail, token);
        res.json({ message: 'message sent to the email' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const verifyPasswordResetToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = (req.query.token as string) || (req.body.token as string);
        const resetDoc = await findValidResetToken(token);
        if (!resetDoc) {
            res.status(400).json({ error: INVALID_RESET_LINK });
            return;
        }

        res.json({
            valid: true,
            message: 'Token valid. You can reset your password.'
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            res.status(400).json({ error: 'Token and newPassword are required' });
            return;
        }

        const resetDoc = await findValidResetToken(token);
        if (!resetDoc) {
            res.status(400).json({ error: INVALID_RESET_LINK });
            return;
        }

        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            res.status(400).json({ error: 'newPassword must be at least 6 characters' });
            return;
        }

        const { email, role, studentId } = resetDoc as any;

        if (role === 'student') {
            const student = studentId != null
                ? await Student.findOne({ studentId }).select('+hash +salt')
                : await Student.findOne({ email }).select('+hash +salt');

            if (!student) {
                await PasswordResetToken.deleteOne({ token });
                res.status(400).json({ error: 'Account no longer found' });
                return;
            }
            // Using the virtual setter
            (student as any).password = newPassword;
            await student.save();
        } else {
            const staff = await Staff.findOne({ email }).select('+hash +salt');
            if (!staff) {
                await PasswordResetToken.deleteOne({ token });
                res.status(400).json({ error: 'Account no longer found' });
                return;
            }
            (staff as any).password = newPassword;
            await staff.save();
        }

        await PasswordResetToken.deleteOne({ token });
        res.json({ message: 'Password updated successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// --- EXISTING METHODS ---

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
        const email = req.body.email?.trim()?.toLowerCase();
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        const [staff, student] = await Promise.all([
            Staff.findOne({ email }),
            Student.findOne({ email })
        ]);
        const role = staff ? 'staff' : (student ? 'student' : null);

        if (!role) {
            res.json({ message: 'cannot find account with this email in the database' });
            return;
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
        await PasswordResetToken.create({ email, token, role, expiresAt });

        await sendPasswordResetEmail(email, token);
        res.json({ message: 'message sent to the email' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            res.status(400).json({ error: "Identifier and password are required" });
            return;
        }

        const normalized = identifier.trim().toLowerCase();
        let user: any = null;
        let role: string | null = null;
        const isEmail = normalized.includes("@");

        if (isEmail) {
            user = await Staff.findOne({ email: normalized }).select('+hash +salt');
            if (user) role = (user as any).role;
            if (!user) {
                user = await Student.findOne({ email: normalized }).select('+hash +salt');
                if (user) role = "student";
            }
        } else {
            const studentId = Number(normalized);
            if (Number.isInteger(studentId)) {
                user = await Student.findOne({ studentId }).select('+hash +salt');
                if (user) role = "student";
            }
        }

        if (!user || !(await user.verifyPassword(password))) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        const tokenPayload: UserPayload = {
            id: role === "student" ? user.studentId : user._id,
            role: role!,
            name: user.name,
            ...(user.department && { department: user.department })
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "24h" });
        res.json({ message: "Login success", token });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const userPayload = req.user as UserPayload;
        if (userPayload.role !== "student") {
            res.json({
                id: userPayload.id,
                role: userPayload.role,
                name: userPayload.name,
                department: userPayload.department
            });
            return;
        }
        const student = await Student.findOne({ studentId: Number(userPayload.id) })
            .populate("requestedSubjects", "creditHours")
            .populate("completedSubjects", "creditHours code");

        if (!student) {
            res.status(404).json({ error: "Student not found" });
            return;
        }
        const registeredHours = (student.requestedSubjects as any[])
            .reduce((sum, subj) => sum + (subj.creditHours || 0), 0);
        const completedHours = (student.completedSubjects as any[])
            .reduce((sum, subj) => sum + (subj.creditHours || 0), 0);

        res.json({
            id: student.studentId,
            _id: student._id,
            role: "student",
            name: student.name,
            department: student.department,
            gpa: student.gpa,
            registeredHours,
            completedHours,
            completedSubjects: (student.completedSubjects as any[]).map(s => s._id.toString())
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userPayload = req.user as UserPayload;

        if (!currentPassword || !newPassword) {
            res.status(400).json({ error: "الرجاء إدخال كلمة المرور الحالية والجديدة" });
            return;
        }

        let user: any;
        if (userPayload.role === "student") {
            user = await Student.findOne({ studentId: Number(userPayload.id) }).select("+hash +salt");
        } else {
            user = await Staff.findOne({ _id: userPayload.id }).select("+hash +salt");
        }

        if (!user || !(await user.verifyPassword(currentPassword))) {
            res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
            return;
        }

        user.password = newPassword;
        await user.save();
        res.json({ message: "تم تحديث كلمة المرور بنجاح" });
    } catch (err: any) {
        res.status(500).json({ error: "حدث خطأ أثناء تغيير كلمة المرور" });
    }
};

export const requireRole = (roles: string | string[]) => {
    const roleList = typeof roles === 'string' ? [roles] : roles;
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as UserPayload;
        if (!user) return res.status(401).json({ error: "Unauthorized" });
        if (!roleList.includes(user.role)) return res.status(403).json({ error: "Forbidden" });
        next();
    };
};