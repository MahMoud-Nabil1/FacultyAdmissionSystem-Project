import Staff from '../models/staff.js';

export const createStaff = async (req, res) => {
    try {
        const staff = new Staff(req.body);
        if (req.body.password) staff.password = req.body.password;
        await staff.save();
        res.status(201).json(staff);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const getAllStaff = async (req, res) => {
    try {
        const staffList = await Staff.find().populate('departments students');
        res.json(staffList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getStaffById = async (req, res) => {
    try {
        const staff = await Staff.findOne({ staffId: req.params.id })
            .populate('departments students');
        if (!staff) return res.status(404).json({ error: "Staff not found" });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateStaff = async (req, res) => {
    try {
        const staff = await Staff.findOne({ staffId: req.params.id });
        if (!staff) return res.status(404).json({ error: "Staff not found" });

        Object.assign(staff, req.body);
        if (req.body.password) staff.password = req.body.password;

        await staff.save();
        res.json(staff);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findOneAndDelete({ staffId: req.params.id });
        if (!staff) return res.status(404).json({ error: "Staff not found" });
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};