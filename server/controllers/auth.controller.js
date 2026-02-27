const crypto = require('crypto');
const Student = require('../models/student');
const Staff = require('../models/staff');
const PasswordResetToken = require('../models/passwordResetToken');
const { sendPasswordResetEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'faculty-admission-secret-key';
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const FACULTY_EMAIL_PREFIX = '20';
const FACULTY_EMAIL_DOMAIN = '@std.sci.cu.edu.eg';

const INVALID_RESET_LINK = 'Invalid or expired reset link';

/**
 * Find a valid password reset token. Returns the document or null (and deletes if expired).
 */
async function findValidResetToken(token) {
    if (!token) return null;
    const resetDoc = await PasswordResetToken.findOne({ token });
    if (!resetDoc) return null;
    if (new Date() > resetDoc.expiresAt) {
        await PasswordResetToken.deleteOne({ token });
        return null;
    }
    return resetDoc;
}

exports.studentLogin = async (req, res) => {
    try {
        const student = await Student
            .findOne({ studentId: req.body.studentId })
            .select('+hash +salt');

        if (!student) {
            return res.status(401).json({ error: "Invalid student ID or password" });
        }

        const ok = await student.verifyPassword(req.body.password);
        if (!ok) {
            return res.status(401).json({ error: "Invalid student ID or password" });
        }

        const token = jwt.sign(
            {id: student.studentId},
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ message: "Login success", token, role: 'student' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.staffLogin = async (req, res) => {
    try {
        const staff = await Staff
            .findOne({ email: req.body.email })
            .select('+hash +salt');

        if (!staff) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const ok = await staff.verifyPassword(req.body.password);
        if (!ok) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign(
            { id: staff._id},
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ message: "Login success", token});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Forgot password: request a reset link by email.
 * Looks up email in both Student and Staff. If found, creates a token in DB and sends email.
 * Body: { email: string }
 */
exports.requestPasswordReset = async (req, res) => {
    try {
        const email = req.body.email?.trim()?.toLowerCase();
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const [staff, student] = await Promise.all([
            Staff.findOne({ email }),
            Student.findOne({ email })
        ]);
        const role = staff ? 'staff' : (student ? 'student' : null);

        if (!role) {
            return res.json({
                message: 'cannot find account with this email in the database'
            });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
        await PasswordResetToken.create({ email, token, role, expiresAt });

        await sendPasswordResetEmail(email, token);

        return res.json({
            message: 'message sent to the email'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Forgot password via faculty email: user enters SID, we send reset link to {studentId}@std.sci.cu.edu.eg
 * Body: { studentId: number }
 */
exports.requestPasswordResetFacultyEmail = async (req, res) => {
    try {
        const studentId = req.body.studentId != null ? Number(req.body.studentId) : NaN;
        if (!Number.isInteger(studentId) || studentId <= 0) {
            return res.status(400).json({ error: 'Valid student ID is required' });
        }

        const student = await Student.findOne({ studentId });
        if (!student) {
            return res.json({
                message: 'cannot find account with this student ID in the database'
            });
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

        return res.json({
            message: 'message sent to the email'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Verify the reset token (e.g. when user lands on reset page from email link).
 * If valid, client can show the "enter new password" form.
 * Token from query: ?token=xxx or body: { token: string }
 */
exports.verifyPasswordResetToken = async (req, res) => {
    try {
        const token = req.query.token || req.body.token;
        const resetDoc = await findValidResetToken(token);
        if (!resetDoc) {
            return res.status(400).json({ error: INVALID_RESET_LINK });
        }

        return res.json({
            valid: true,
            message: 'Token valid. You can reset your password.'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Reset password using the token from the email link.
 * Body: { token: string, newPassword: string }
 */
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and newPassword are required' });
        }

        const resetDoc = await findValidResetToken(token);
        if (!resetDoc) {
            return res.status(400).json({ error: INVALID_RESET_LINK });
        }

        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            return res.status(400).json({ error: 'newPassword must be at least 6 characters' });
        }

        const { email, role, studentId } = resetDoc;

        if (role === 'student') {
            const student = studentId != null
                ? await Student.findOne({ studentId }).select('+hash +salt')
                : await Student.findOne({ email }).select('+hash +salt');
            if (!student) {
                await PasswordResetToken.deleteOne({ token });
                return res.status(400).json({ error: 'Account no longer found' });
            }
            student.password = newPassword;
            await student.save();
        } else {
            const staff = await Staff.findOne({ email }).select('+hash +salt');
            if (!staff) {
                await PasswordResetToken.deleteOne({ token });
                return res.status(400).json({ error: 'Account no longer found' });
            }
            staff.password = newPassword;
            await staff.save();
        }

        await PasswordResetToken.deleteOne({ token });
        return res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 *
 * @param req
 * @param res
 * @returns {Promise<void>}
 *
 * Gets user information using JWT token
 */
exports.getMe = async (req, res) => {
    try {
        res.json({
            id: req.user._id || req.user.studentId,
            role: req.user.role || "student",
            name: req.user.name,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};