const Student = require('../models/student');
const Staff = require('../models/staff');

exports.login = async (req, res) => {
    try {
        const student = await Student //try student
            .findOne({ id: req.body.studentId })
            .select('+hash +salt');
        const staff = await Staff //try staff
            .findOne({id: req.body.id})
            .select('+hash +salt');

        if (!student && !staff){
            return res.status(401).json({ error: "Invalid credentials" });
        }
        let okStudent = false;
        let okStaff = false;
        if (student) {
            okStudent = await student.verifyPassword(req.body.password);
        }
        if (staff){
            //TODO: verify password for staff too
        }

        if (!okStudent && !okStaff){
            return res.status(401).json({ error: "Invalid credentials" });
        }

        res.json({ message: "Login success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};