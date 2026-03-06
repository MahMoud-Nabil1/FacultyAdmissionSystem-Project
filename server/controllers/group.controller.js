const { Group } = require('../models/group');

// Create a new group
exports.createGroup = async (req, res) => {
    try {
        const group = new Group(req.body);
        await group.save();
        res.status(201).json(group);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


// Get all groups
exports.getAllGroups = async (req, res) => {
    try {
        const groups = await Group.find().populate('students');
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get group by ID
exports.getGroupById = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id).populate('students');
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json(group);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update group
exports.updateGroup = async (req, res) => {
    try {
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('students');
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json(group);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete group
exports.deleteGroup = async (req, res) => {
    try {
        const group = await Group.findByIdAndDelete(req.params.id);
        if (!group) return res.status(404).json({ error: 'Group not found' });
        res.json({ message: 'Group deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Add student to group
exports.addStudentToGroup = async (req, res) => {
    try {
        const { studentId } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) return res.status(404).json({ error: 'Group not found' });

        // Check if group is at capacity
        if (group.students.length >= group.capacity) {
            return res.status(400).json({ error: 'Group has reached maximum capacity' });
        }

        // Check if student is already in group
        if (group.students.includes(studentId)) {
            return res.status(400).json({ error: 'Student already in this group' });
        }

        group.students.push(studentId);
        await group.save();

        const updatedGroup = await Group.findById(req.params.id).populate('students');
        res.json(updatedGroup);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Remove student from group
exports.removeStudentFromGroup = async (req, res) => {
    try {
        const { studentId } = req.body;
        const group = await Group.findById(req.params.id);

        if (!group) return res.status(404).json({ error: 'Group not found' });

        group.students = group.students.filter(id => id.toString() !== studentId);
        await group.save();

        const updatedGroup = await Group.findById(req.params.id).populate('students');
        res.json(updatedGroup);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get groups by day
exports.getGroupsByDay = async (req, res) => {
    try {
        const groups = await Group.find({ day: req.params.day }).populate('students');
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get groups by type
exports.getGroupsByType = async (req, res) => {
    try {
        const groups = await Group.find({ type: req.params.type }).populate('students');
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};