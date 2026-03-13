const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

        const token = authHeader.split(" ")[1]; // Bearer <token>
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        req.user = jwt.verify(token, JWT_SECRET); // attach JWT payload
        next();
    } catch (err) {
        console.error("JWT auth error:", err.message);
        return res.status(401).json({ error: "Invalid token" });
    }
}

module.exports = { authenticate };