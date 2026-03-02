const Subject = require('../models/subject');

exports.createSubject = async (req, res) => {
    try {
        const subject = new Subject(req.body);
        await subject.save();
        res.status(201).json(subject);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().populate('prerequisites');
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id).populate('prerequisites');
        if (!subject) return res.status(404).json({ error: 'Subject not found' });
        res.json(subject);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('prerequisites');
        if (!subject) return res.status(404).json({ error: 'Subject not found' });
        res.json(subject);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);
        if (!subject) return res.status(404).json({ error: 'Subject not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
