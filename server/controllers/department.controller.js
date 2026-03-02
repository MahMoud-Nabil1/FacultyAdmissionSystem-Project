const Department = require('../models/department');


exports.createDepartment = async (req, res) => {
    try {
        const department = new Department(req.body);
        await department.save();
        res.status(201).json(department);

    } catch (err) {

        if (err.code === 11000) {
            return res.status(409).json({
                error: "قسم بنفس الكود موجود بالفعل"
            });
        }
        res.status(400).json({ error: err.message });
    }
};


exports.getAllDepartments = async (req, res) => {
    try {
        const departments = await Department
            .find()
            .populate('subjects');

        res.json(departments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.getDepartmentById = async (req, res) => {
    try {

        const department = await Department
            .findOne({ id: req.params.id })
            .populate('subjects');

        if (!department)
            return res.status(404).json({ error: "القسم غير موجود" });

        res.json(department);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.updateDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);

        if (!department)
            return res.status(404).json({ error: "القسم غير موجود" });


        Object.assign(department, req.body);

        await department.save();
        res.json(department);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


exports.deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);

        if (!department)
            return res.status(404).json({ error: "القسم غير موجود" });

        res.json({ message: "تم حذف القسم بنجاح" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};