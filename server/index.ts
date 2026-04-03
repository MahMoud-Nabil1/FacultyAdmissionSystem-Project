import path from "path";
import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, ".env") });

import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/student.routes";
import staffRoutes from "./routes/staff.routes";
import subjectRoutes from "./routes/subject.routes";
import announcementRoutes from "./routes/announcement.routes";
import groupRoutes from "./routes/group.routes";
import systemSettingRoutes from "./routes/systemSetting.routes";

const app = express();

app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
        ],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register models
import "./models/department";
import "./models/subject";
import "./models/student";
import "./models/staff";
import "./models/passwordResetToken";
import "./models/announcement";
import "./models/group";

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/settings", systemSettingRoutes);

app.use((req: Request, res: Response) => {
    res.status(404).json({ message: "Route not found" });
});

app.use(
    (err: any, req: Request, res: Response, next: NextFunction) => {
        res
            .status(err.status || 500)
            .json({ message: err.message || "Something went wrong" });
    }
);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI as string;

mongoose
    .connect(MONGO_URI)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err: Error) => {
        console.error(err.message);
        process.exit(1);
    });

export default app;