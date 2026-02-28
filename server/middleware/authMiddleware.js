const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "faculty-admission-secret-key";

async function authenticate(req, res, next) {
    try {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ error: "Unauthorized" });

        const token = auth.split(" ")[1];
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}

module.exports = { authenticate };