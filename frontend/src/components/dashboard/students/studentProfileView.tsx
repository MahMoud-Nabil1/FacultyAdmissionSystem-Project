import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    addStudentToGroup,
    getAllGroups,
    getStudentById,
    removeStudentFromGroup
} from "../../../services/api";
import { useTranslation } from "react-i18next";
import "./studentProfileView.css"

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
    const navigate = useNavigate();
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
            <header className="profile-header">
                <h2>{t("studentProfile.title")}</h2>
                <button
                    className="btn btn-add"
                    style={{ height: "fit-content" }}
                    onClick={() => navigate("/admin-dashboard/table?type=students")}
                >
                    {t("dashboardCommon.back")}
                </button>
            </header>

            {/* Top Info Cards */}
            <div className="student-info-grid">
                <div className="info-card">
                    <span className="info-label">{t("studentProfile.studentCode")}</span>
                    <span className="info-value">{student.studentId}</span>
                </div>
                <div className="info-card">
                    <span className="info-label">{t("studentProfile.nameLabel")}</span>
                    <span className="info-value">{student.name}</span>
                </div>
                <div className="info-card">
                    <span className="info-label">{t("studentProfile.emailLabel")}</span>
                    <span className="info-value">{student.email}</span>
                </div>
                <div className="info-card">
                    <span className="info-label">{t("studentProfile.gpaLabel")}</span>
                    <span className="info-value">{student.gpa}</span>
                </div>
            </div>

            {/* Subjects Sections */}
            <h3 className="section-title">{t("studentProfile.completedSubjects")}</h3>
            <div className="subjects-container">
                {student.completedSubjects.length > 0 ? (
                    student.completedSubjects.map((s) => (
                        <div key={s._id} className="subject-tag">
                            <span>{s.code}</span> {s.name}
                        </div>
                    ))
                ) : (
                    <p className="text-muted">None</p>
                )}
            </div>

            <h3 className="section-title">{t("studentProfile.requestedSubjects")}</h3>
            <div className="subjects-container">
                {student.requestedSubjects.length > 0 ? (
                    student.requestedSubjects.map((s) => (
                        <div key={s._id} className="subject-tag">
                            <span>{s.code}</span> {s.name}
                        </div>
                    ))
                ) : (
                    <p className="text-muted">None</p>
                )}
            </div>

            {/* Registered Groups */}
            <h3 className="section-title">{t("studentProfile.registeredGroups")}</h3>
            <div className="table-wrapper">
                {studentGroups.length === 0 ? (
                    <p style={{ padding: '2rem' }}>{t("studentProfile.noRegisteredGroups")}</p>
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
                                <td><strong>{g.subject}</strong></td>
                                <td><span className="type-badge">{t(`studentProfile.groupTypes.${g.type}`)}</span></td>
                                <td>{g.number}</td>
                                <td>{g.day}</td>
                                <td>{g.from}-{g.to}</td>
                                <td>{g.place}</td>
                                <td>
                                    <button
                                        className="btn btn-remove"
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
            </div>

            {/* Available Groups */}
            <h3 className="section-title">{t("studentProfile.availableGroups")}</h3>
            <div className="table-wrapper">
                {availableGroups.length === 0 ? (
                    <p style={{ padding: '2rem' }}>{t("studentProfile.noAvailableGroups")}</p>
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
                                <td><strong>{g.subject}</strong></td>
                                <td><span className="type-badge">{t(`studentProfile.groupTypes.${g.type}`)}</span></td>
                                <td>{g.number}</td>
                                <td>{g.day}</td>
                                <td>{g.from}-{g.to}</td>
                                <td>{g.place}</td>
                                <td>
                                    <button
                                        className="btn btn-add"
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
        </div>
    );
};

export default StudentProfile;