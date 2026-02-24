const Student = require('../models/student');
const nodemailer = require('nodemailer');
exports.createStudent = async (req, res) => {
    try {
        const student = new Student(req.body);
        student.password = req.body.password;
        await student.save();

        res.status(201).json(student);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student
            .find()
            .populate('department completedSubjects requestedSubjects');

        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentById = async (req, res) => {
    try {
        const student = await Student
            .findOne({ studentId: req.params.id })
            .populate('department');

        if (!student)
            return res.status(404).json({ error: "Student not found" });

        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const student = await Student.findOne({ studentId: req.params.id });

        if (!student)
            return res.status(404).json({ error: "Student not found" });

        Object.assign(student, req.body);

        if (req.body.password)
            student.password = req.body.password;

        await student.save();

        res.json(student);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findOneAndDelete({
            studentId: req.params.id
        });

        if (!student)
            return res.status(404).json({ error: "Student not found" });

        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    exports.contactIT = async (req, res) => {
        try {
            const { studentCode, subjectName, message, replyEmail } = req.body;


            const student = await Student.findOne({ studentId: studentCode });
            if (!student) {
                return res.status(404).json({ error: "Student code not found." });
            }


            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'your-college-it-email@gmail.com',
                    pass: 'your-app-password'
                }
            });


            const mailOptions = {
                from: replyEmail,
                to: '',
                subject: `IT Support Request: ${subjectName} - Student: ${studentCode}`,
                text: `
                New Support Ticket:
                ------------------
                Student Code: ${studentCode}
                Course: ${subjectName}
                Reply to: ${replyEmail}
                
                Issue:
                ${message}
            `
            };


            await transporter.sendMail(mailOptions);

            res.status(200).json({ message: "Success! Message sent to IT Support via Email." });

        } catch (err) {
            console.error("Email Error:", err);
            res.status(500).json({ error: "Could not send email. " + err.message });
        }
    };
    exports.contactAdmin = async (req, res) => {
        try {
            const { studentCode, subjectName, message, replyEmail } = req.body;


            const student = await Student.findOne({ studentId: studentCode });
            if (!student) {
                return res.status(404).json({ error: "Student code not found." });
            }


            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'your-college-email@gmail.com',
                    pass: 'your-app-password'
                }
            });


            const mailOptions = {
                from: replyEmail,
                to: '',
                subject: `Admin Request: ${subjectName} - Student: ${studentCode}`,
                text: `
                New Administration Ticket:
                -------------------------
                Student Code: ${studentCode}
                Course: ${subjectName}
                Reply to: ${replyEmail}
                
                Message/Issue:
                ${message}
            `
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({ message: "Success! Message sent to Administration." });

        } catch (err) {
            console.error("Email Error:", err);
            res.status(500).json({ error: "Could not send email. " + err.message });
        }
    };
};