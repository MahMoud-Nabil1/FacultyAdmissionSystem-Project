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
                department?: string;
            };
        }
    }
}

export interface UserPayload {
    id: string;
    role: string;
    name: string;
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

        req.user = jwt.verify(token, JWT_SECRET);

        next();
    } catch (err: any) {
        console.error("JWT auth error:", err.message);
        return res.status(401).json({ error: "Invalid token" });
    }
}