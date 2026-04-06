import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    addStudentToGroup,
    getAllGroups,
    getStudentById,
    removeStudentFromGroup
} from "../../../services/api";
import { useTranslation } from "react-i18next";

interface Subject {
    _id: string;
    name: string;
    code: string;
}

interface Student {
    _id: string;
    studentId: number;
    name: string;
    email: string;
    gpa: number;
    completedSubjects: Subject[];
    requestedSubjects: Subject[];
}

interface Group {
    _id: string;
    number: number;
    subject: string;
    type: "lecture" | "lab" | "tutorial" | "seminar";
    day: string;
    from: number;
    to: number;
    students: (string | { _id: string })[];
    capacity: number;
    place: string;
}

const StudentProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const [student, setStudent] = useState<Student | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [studentData, groupsData] = await Promise.all([
                    getStudentById(id!),
                    getAllGroups()
                ]);
                setStudent(studentData);
                setGroups(groupsData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (!student) return <p>{t("studentProfile.loadingStudent")}</p>;

    const studentGroups = groups.filter((g) =>
        g.students.some((s) =>
            typeof s === "string" ? s === student._id : s._id === student._id
        )
    );

    const availableGroups = groups.filter(
        (g) =>
            !g.students.some((s) =>
                typeof s === "string" ? s === student._id : s._id === student._id
            )
    );

    const handleAddToGroup = async (groupId: string) => {
        if (!student) return;
        setActionLoading(true);
        try {
            await addStudentToGroup(groupId, student._id);
            const [updatedStudent, updatedGroups] = await Promise.all([
                getStudentById(student._id),
                getAllGroups()
            ]);
            setStudent(updatedStudent);
            setGroups(updatedGroups);
        } catch (err) {
            console.error(err);
            alert(t("studentProfile.addGroupFailed"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveFromGroup = async (groupId: string) => {
        if (!student) return;
        setActionLoading(true);
        try {
            await removeStudentFromGroup(groupId, student._id);
            const [updatedStudent, updatedGroups] = await Promise.all([
                getStudentById(student._id),
                getAllGroups()
            ]);
            setStudent(updatedStudent);
            setGroups(updatedGroups);
        } catch (err) {
            console.error(err);
            alert(t("studentProfile.removeGroupFailed"));
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <h2>{t("studentProfile.title")}</h2>

            <div className="student-info">
                <p><strong>{t("studentProfile.studentCode")}:</strong> {student.studentId}</p>
                <p><strong>{t("studentProfile.nameLabel")}:</strong> {student.name}</p>
                <p><strong>{t("studentProfile.emailLabel")}:</strong> {student.email}</p>
                <p><strong>{t("studentProfile.gpaLabel")}:</strong> {student.gpa}</p>
            </div>

            <h3>{t("studentProfile.completedSubjects")}</h3>
            <ul>
                {student.completedSubjects.map((s) => (
                    <li key={s._id}>{s.code} - {s.name}</li>
                ))}
            </ul>

            <h3>{t("studentProfile.requestedSubjects")}</h3>
            <ul>
                {student.requestedSubjects.map((s) => (
                    <li key={s._id}>{s.code} - {s.name}</li>
                ))}
            </ul>

            <h3>{t("studentProfile.registeredGroups")}</h3>
            {studentGroups.length === 0 ? (
                <p>{t("studentProfile.noRegisteredGroups")}</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>{t("studentProfile.subject")}</th>
                        <th>{t("studentProfile.type")}</th>
                        <th>{t("studentProfile.groupNumber")}</th>
                        <th>{t("studentProfile.day")}</th>
                        <th>{t("studentProfile.time")}</th>
                        <th>{t("studentProfile.place")}</th>
                        <th>{t("studentProfile.action")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {studentGroups.map((g) => (
                        <tr key={g._id}>
                            <td>{g.subject}</td>
                            <td>{t(`studentProfile.groupTypes.${g.type}`)}</td>
                            <td>#{g.number}</td>
                            <td>{g.day}</td>
                            <td>{g.from}-{g.to}</td>
                            <td>{g.place}</td>
                            <td>
                                <button
                                    onClick={() => handleRemoveFromGroup(g._id)}
                                    disabled={actionLoading}
                                >
                                    {t("studentProfile.removeBtn")}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            <h3>{t("studentProfile.availableGroups")}</h3>
            {availableGroups.length === 0 ? (
                <p>{t("studentProfile.noAvailableGroups")}</p>
            ) : (
                <table>
                    <thead>
                    <tr>
                        <th>{t("studentProfile.subject")}</th>
                        <th>{t("studentProfile.type")}</th>
                        <th>{t("studentProfile.groupNumber")}</th>
                        <th>{t("studentProfile.day")}</th>
                        <th>{t("studentProfile.time")}</th>
                        <th>{t("studentProfile.place")}</th>
                        <th>{t("studentProfile.action")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {availableGroups.map((g) => (
                        <tr key={g._id}>
                            <td>{g.subject}</td>
                            <td>{t(`studentProfile.groupTypes.${g.type}`)}</td>
                            <td>#{g.number}</td>
                            <td>{g.day}</td>
                            <td>{g.from}-{g.to}</td>
                            <td>{g.place}</td>
                            <td>
                                <button
                                    onClick={() => handleAddToGroup(g._id)}
                                    disabled={actionLoading}
                                >
                                    {t("studentProfile.addBtn")}
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default StudentProfile;