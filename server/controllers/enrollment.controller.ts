import mongoose from "mongoose";
import {Request, Response} from "express";
import {EnrollmentRequest} from "../models/enrollmentRequest";
import {Group} from "../models/group";
import Student from "../models/student";
import {UserPayload} from "../middleware/authMiddleware";
import {ensureSubjectRequested, hasTimeCollision} from "../utils/enrollment.utils";
import SystemSetting from "../models/systemSetting";

export const processEnrollmentRequest = async (req: Request, res: Response): Promise<void> => {
    const { requestId } = req.params;

    const session = await mongoose.startSession();

    try {
        let result: any = null;

        await session.withTransaction(async () => {
            // Step 1: Atomically claim the request
            const request = await EnrollmentRequest.findOneAndUpdate(
                { _id: requestId, status: 'pending' },
                { status: 'processing' },
                { new: true, session }
            );

            if (!request) {
                throw new Error("Request already processed or not found");
            }

            // Load group
            const group = await Group.findById(request.group).session(session);
            if (!group) {
                request.status = 'rejected';
                await request.save({ session });
                throw new Error("Group not found");
            }

            // Check for time collision
            const collision = await hasTimeCollision(request.student, group, session);
            if (collision) {
                request.status = 'rejected';
                await request.save({ session });
                throw new Error("Student has a time collision with another group");
            }

            // Try atomic enrollment
            const updatedGroup = await Group.findOneAndUpdate(
                {
                    _id: group._id,
                    students: { $ne: request.student },
                    $expr: { $lt: [{ $size: "$students" }, "$capacity"] }
                },
                {
                    $addToSet: { students: request.student } // safer than push
                },
                { new: true, session }
            );

            if (!updatedGroup) {
                request.status = 'rejected';
                await request.save({ session });
                result = { request, group: null };
                return;
            }

            // Update student
            await ensureSubjectRequested(request.student, group.subject, session);

            request.status = 'approved';
            await request.save({ session });

            result = { request, group: updatedGroup };
        });

        res.json(result);

    } catch (err: any) {
        res.status(400).json({ error: err.message });
    } finally {
        await session.endSession();
    }
};

export const requestJoinGroup = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as UserPayload;
    const groupId = req.params.id as string;

    if (user.role !== 'student') {
        res.status(403).json({ error: "Only students can join groups" });
        return;
    }

    const session = await mongoose.startSession();
    try {
        let resultStatus = "pending";

        await session.withTransaction(async () => {
            const settings = await SystemSetting.findOne().session(session);
            if (settings && !settings.registrationOpen) {
                throw new Error("registration.errors.registrationClosed");
            }

            const student = await Student.findOne({ studentId: Number(user.id) }).session(session);
            const group = await Group.findById(groupId).session(session);

            if (!student || !group) throw new Error("Student or Group not found");

            // Check if already in group
            if (group.students.some(id => id.toString() === student._id.toString())) {
                throw new Error("registration.errors.alreadyInGroup");
            }

            // Check for time collision
            const collision = await hasTimeCollision(student._id as mongoose.Types.ObjectId, group, session);
            if (collision) {
                throw new Error("registration.errors.timeCollision");
            }

            // Auto-process logic
            if (group.students.length < group.capacity) {
                const enrolledGroup = await Group.findOneAndUpdate(
                    { _id: groupId, $expr: { $lt: [{ $size: "$students" }, "$capacity"] } },
                    { $addToSet: { students: student._id } },
                    { new: true, session }
                );

                if (enrolledGroup) {
                    await ensureSubjectRequested(student._id as mongoose.Types.ObjectId, group.subject, session);
                    resultStatus = "enrolled";
                    return;
                }
            }

            const existingRequest = await EnrollmentRequest.findOne({
                student: student._id,
                group: group._id,
                status: 'pending'
            }).session(session);

            if (existingRequest) throw new Error("registration.errors.waitlistFull");

            const newRequest = new EnrollmentRequest({
                student: student._id,
                group: group._id,
                status: 'pending'
            });
            await newRequest.save({ session });
        });

        res.status(201).json({
            message: resultStatus === "enrolled" ? "Successfully enrolled!" : "Group full: Added to waitlist",
            status: resultStatus
        });

    } catch (err: any) {
        res.status(400).json({ error: err.message });
    } finally {
        await session.endSession();
    }
};