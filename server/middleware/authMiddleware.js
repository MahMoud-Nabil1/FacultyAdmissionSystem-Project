const jwt = require("jsonwebtoken");
const Student = require("../models/student");
const Staff = require("../models/staff");

const JWT_SECRET = process.env.JWT_SECRET || "faculty-admission-secret-key";

async function authenticate(req, res, next) {
    try {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ error: "Unauthorized" });

        const token = auth.split(" ")[1];
        const payload = jwt.verify(token, JWT_SECRET);

        let user;

        if (payload.role === "student") {
            user = await Student.findById(payload.id);
        } else {
            user = await Staff.findById(payload.id);
        }

        if (!user) return res.status(401).json({ error: "User not found" });

        req.user = user;
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}

module.exports = { authenticate };