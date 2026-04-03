import mongoose from "mongoose";
import { Group, IGroup } from "../models/group";
import { Student } from "../models/student";
import { Subject } from "../models/subject";

/**
 * Checks if a student has any group that overlaps in time with the given group.
 */
export async function hasTimeCollision(
    studentId: mongoose.Types.ObjectId,
    newGroup: IGroup,
    session?: mongoose.ClientSession
): Promise<boolean> {
    const studentGroups = await Group.find({
        students: studentId
    }).session(session || null);

    return studentGroups.some(group => {
        if (group.day !== newGroup.day) return false;
        // Collision if [from1, to1] overlaps with [from2, to2]
        // Overlap exists if max(from1, from2) < min(to1, to2)
        return Math.max(group.from, newGroup.from) < Math.min(group.to, newGroup.to);
    });
}

/**
 * Ensures the student's requestedSubjects list includes the subject associated with the group.
 */
export async function ensureSubjectRequested(
    studentId: mongoose.Types.ObjectId,
    subjectCode: string,
    session?: mongoose.ClientSession
): Promise<void> {
    const student = await Student.findById(studentId).session(session || null);
    if (!student) return;

    const subjectDoc = await Subject.findOne({
        code: new RegExp(`^${subjectCode}$`, 'i')
    }).session(session || null);

    if (subjectDoc) {
        const alreadyRequested = student.requestedSubjects.some(
            id => id.toString() === subjectDoc._id.toString()
        );

        if (!alreadyRequested) {
            student.requestedSubjects.push(subjectDoc._id as any);
            await student.save({ session });
        }
    }
}
