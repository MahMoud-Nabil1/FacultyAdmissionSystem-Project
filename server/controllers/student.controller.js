const Student = require('../models/student');
const nodemailer = require('nodemailer');


exports.createStudent = async (req, res) => {
    try {
        const {email, studentId, password, ...rest} = req.body;

        // Check if a student already exists with studentId
        const existingStudent = await Student.findOne({studentId});

        if (existingStudent) {
            return res.status(409).json({error: 'Student with this email or ID already exists'});
        }

        const student = new Student({email, studentId, ...rest});
        student.password = password; // gets automatically hashed upon saving
        await student.save();

        res.status(201).json(student);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
};
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student
            .find()
            .populate('department completedSubjects requestedSubjects');

        res.json(students);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
};

exports.getStudentById = async (req, res) => {
    try {
        const student = await Student
            .findOne({studentId: req.params.id})
            .populate('department');

        if (!student)
            return res.status(404).json({error: "Student not found"});

        res.json(student);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const student = await Student.findOne({studentId: req.params.id});

        if (!student)
            return res.status(404).json({error: "Student not found"});

        Object.assign(student, req.body);

        if (req.body.password)
            student.password = req.body.password;

        await student.save();

        res.json(student);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({
            studentId: req.params.id
        });

        if (!student)
            return res.status(404).json({error: "Student not found"});

        res.json({message: "Deleted successfully"});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
};


exports.contactIT = async (req, res) => {
    try {
        const {studentCode, subjectName, message, replyEmail} = req.body;


        if (!subjectName || !subjectName.trim()) {
            return res.status(400).json({error: "موضوع المشكلة مطلوب."});
        }

        const student = await Student.findOne({studentId: studentCode});
        if (!student) return res.status(404).json({error: "كود الطالب غير موجود."});

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {user: process.env.ADMIN_EMAIL, pass: process.env.ADMIN_EMAIL_PASS}
        });

        const mailOptions = {
            from: replyEmail,
            to: process.env.IT_EMAIL,
            subject: `[IT Support] ${subjectName} - Student: ${studentCode}`,
            text: `طلب دعم فني:\nكود الطالب: ${studentCode}\nالموضوع: ${subjectName}\nالبريد: ${replyEmail}\n\nالمشكلة:\n${message}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({message: "تم الإرسال بنجاح."});
    } catch (err) {
        res.status(500).json({error: "خطأ في السيرفر: " + err.message});
    }
};


exports.contactAdmin = async (req, res) => {
    try {
        const {studentCode, subjectName, message, replyEmail} = req.body;

        if (!subjectName || !subjectName.trim()) {
            return res.status(400).json({error: "كود المقرر مطلوب للإدارة."});
        }

        const student = await Student.findOne({studentId: studentCode});
        if (!student) return res.status(404).json({error: "كود الطالب غير موجود."});

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {user: process.env.ADMIN_EMAIL, pass: process.env.ADMIN_EMAIL_PASS}
        });

        const mailOptions = {
            from: replyEmail,
            to: process.env.ADMIN_EMAIL,
            subject: `[Admin] Course: ${subjectName} - Student: ${studentCode}`,
            text: `طلب إداري:\nكود الطالب: ${studentCode}\nكود المقرر: ${subjectName}\nالبريد: ${replyEmail}\n\nالرسالة:\n${message}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({message: "تم الإرسال بنجاح."});
    } catch (err) {
        res.status(500).json({error: "خطأ في السيرفر: " + err.message});
    }
};