const Student = require('../models/student');
const Staff = require('../models/staff');

/*
searches for student and staff, detecting whether the login is staff or just student
This is for combined logins in case we want the staff to login to the same portal the student uses (and still enter the dashboard)
Can be split later when a different decision is made
- Abdallah
*/
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
            okStaff = await staff.verifyPassword(req.body.password);
        }

        if (!okStudent && !okStaff){
            return res.status(401).json({ error: "Invalid credentials" });
        }

        res.json({ message: "Login success" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};