const Student = require('../models/student');

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
};