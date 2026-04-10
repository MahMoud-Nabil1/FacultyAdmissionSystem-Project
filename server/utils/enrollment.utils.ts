import mongoose from "mongoose";
import { Group, IGroup } from "../models/group";
import { Student } from "../models/student";
import { Subject } from "../models/subject";
import { Settings } from "../models/announcement";

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

/**
 * Calculates a student's academic level based on completed credit hours.
 * Level thresholds: 0-30 = Level 1, 31-60 = Level 2, 61-90 = Level 3, 91+ = Level 4
 */
export async function getStudentLevelFromHours(
    studentId: mongoose.Types.ObjectId,
    session?: mongoose.ClientSession
): Promise<'1' | '2' | '3' | '4'> {
    const student = await Student.findById(studentId).session(session || null);
    if (!student || student.completedSubjects.length === 0) return '1';

    // Sum credit hours from all completed subjects
    const completedSubjects = await Subject.find({
        _id: { $in: student.completedSubjects }
    }).session(session || null);

    const totalHours = completedSubjects.reduce((sum, sub) => sum + sub.creditHours, 0);

    if (totalHours <= 30) return '1';
    if (totalHours <= 60) return '2';
    if (totalHours <= 90) return '3';
    return '4';
}

/**
 * Checks if a student has completed all prerequisites for a subject.
 * Returns { met: true } if all prerequisites are completed, or { met: false, missing: [...] } otherwise.
 */
export async function checkPrerequisites(
    studentId: mongoose.Types.ObjectId,
    subjectId: mongoose.Types.ObjectId,
    session?: mongoose.ClientSession
): Promise<{ met: boolean; missing: string[] }> {
    const student = await Student.findById(studentId).session(session || null);
    const subject = await Subject.findById(subjectId).session(session || null);

    if (!student || !subject) {
        return { met: false, missing: [] };
    }

    const completedIds = new Set(student.completedSubjects.map(id => id.toString()));
    const missing = subject.prerequisites.filter(
        prereq => !completedIds.has(prereq.toString())
    ).map(prereq => prereq.toString());

    return { met: missing.length === 0, missing };
}

/**
 * Validates that a student's GPA is within the allowed range defined in settings.
 * Returns { valid: true } if valid, or { valid: false, gpaMin, gpaMax, studentGpa } if invalid.
 */
export async function checkGpaRange(
    studentId: mongoose.Types.ObjectId,
    session?: mongoose.ClientSession
): Promise<{ valid: true } | { valid: false; gpaMin: number; gpaMax: number; studentGpa: number }> {
    const student = await Student.findById(studentId).session(session || null);
    const settings = await Settings.findOne().session(session || null);

    if (!student || !settings) {
        return { valid: false, gpaMin: 0, gpaMax: 0, studentGpa: 0 };
    }

    const gpaValid = student.gpa >= settings.gpaMin && student.gpa <= settings.gpaMax;

    if (gpaValid) {
        return { valid: true };
    }

    return {
        valid: false,
        gpaMin: settings.gpaMin,
        gpaMax: settings.gpaMax,
        studentGpa: student.gpa
    };
}

/**
 * Validates that a subject's level matches the student's calculated level
 * AND that the level is available in the current semester settings.
 * Returns { valid: true } if valid, or { valid: false, studentLevel, subjectLevel, reason } if invalid.
 */
export async function checkSubjectLevel(
    subjectId: mongoose.Types.ObjectId,
    studentId: mongoose.Types.ObjectId,
    session?: mongoose.ClientSession
): Promise<{ valid: true } | { valid: false; studentLevel: string; subjectLevel: string; reason: string }> {
    const subject = await Subject.findById(subjectId).session(session || null);
    const settings = await Settings.findOne().session(session || null);

    if (!subject || !settings) {
        return { valid: false, studentLevel: '', subjectLevel: '', reason: 'Settings or subject not found' };
    }

    // Calculate student's level from completed credit hours
    const studentLevel = await getStudentLevelFromHours(studentId, session);

    // Check 1: Subject level must match or be below student's level (students can take lower-level courses)
    const subjectLevelNum = parseInt(subject.level);
    const studentLevelNum = parseInt(studentLevel);

    if (subjectLevelNum > studentLevelNum) {
        return {
            valid: false,
            studentLevel,
            subjectLevel: subject.level,
            reason: 'Subject level is above your current academic level'
        };
    }

    // Check 2: Subject level must be available this semester (in settings.level)
    if (!settings.level.includes(subject.level)) {
        return {
            valid: false,
            studentLevel,
            subjectLevel: subject.level,
            reason: 'This level is not available for enrollment this semester'
        };
    }

    return { valid: true };
}
