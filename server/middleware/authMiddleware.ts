import jwt, {JwtPayload} from "jsonwebtoken";
import {NextFunction, Request, Response} from "express";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev-only";

declare global {
    namespace Express {
        interface Request {
            user?: string | JwtPayload | {
                id: string;
                role: string;
                name: string;
                sessionId: string;
                department?: string;
            };
        }
    }
}

export interface UserPayload {
    id: string;
    role: string;
    name: string;
    sessionId: string;
    department?: string;
}

/**
 * Middleware to authenticate requests via JWT
 */
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1]; // Bearer <token>
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;

        // --- STRICT SESSION MANAGEMENT ---
        const { id, role, sessionId } = decoded;
        let user: any;

        if (role === "student") {
            const { Student } = await import("../models/student");
            user = await Student.findOne({ studentId: Number(id) });
        } else {
            const Staff = (await import("../models/staff")).default;
            user = await Staff.findById(id);
        }

        if (!user || user.currentSessionId !== sessionId) {
            return res.status(401).json({
                error: "Session invalidated",
                code: "SESSION_EXPIRED"
            });
        }

        req.user = decoded;
        next();
    } catch (err: any) {
        console.error("JWT auth error:", err.message);
        return res.status(401).json({ error: "Invalid token" });
    }
}