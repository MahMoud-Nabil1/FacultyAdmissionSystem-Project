const Student = require('../models/student');
const Staff = require('../models/staff');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'faculty-admission-secret-key';

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
            { studentId: student.studentId, role: 'student' },
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
            { _id: staff._id, role: 'staff' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ message: "Login success", token, role: 'staff' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};