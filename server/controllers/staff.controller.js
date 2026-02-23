const Staff = require('../models/staff');

exports.createStaff = async (req, res) => {
    try {
        const staff = new Staff(req.body);
        if (req.body.password) staff.password = req.body.password;
        await staff.save();
        res.status(201).json(staff);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getAllStaff = async (req, res) => {
    try {
        const staffList = await Staff.find().populate('departments students');
        res.json(staffList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStaffById = async (req, res) => {
    try {
        const staff = await Staff.findOne({ _id: req.params._id })
            .populate('departments students');
        if (!staff) return res.status(404).json({ error: "Staff not found" });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateStaff = async (req, res) => {
    try {
        const staff = await Staff.findOne({ id: req.params._id });
        if (!staff) return res.status(404).json({ error: "Staff not found" });

        Object.assign(staff, req.body);
        if (req.body.password) staff.password = req.body.password;

        await staff.save();
        res.json(staff);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findOneAndDelete({ _id: req.params._id });
        if (!staff) return res.status(404).json({ error: "Staff not found" });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};