import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    addStudentToGroup,
    getAllGroups,
    getStudentById,
    removeStudentFromGroup,
    getAllSubjects,
    getAllStaff,
    assignAcademicAdvisor
} from "../../../services/api";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import "./studentProfileView.css"

interface Subject {
    _id: string;
    name: string;
    code: string;
    creditHours: number;
}

interface Student {
    _id: string;
    studentId: number;
    name: string;
    email: string;
    gpa: number;
    completedSubjects: Subject[];
    requestedSubjects: Subject[];
    academicAdvisor?: { _id: string; name: string; email: string };
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

interface StaffMember {
    _id: string;
    name: string;
    email: string;
    role: string;
}

const StudentProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [student, setStudent] = useState<Student | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    const [showAdvisorModal, setShowAdvisorModal] = useState(false);
    const [selectedAdvisor, setSelectedAdvisor] = useState("");
    const isAdmin = user?.role === "admin";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentData, groupsData, subjectsData] = await Promise.all([
                    getStudentById(id!),
                    getAllGroups(),
                    getAllSubjects()
                ]);
                setStudent(studentData);
                setGroups(groupsData);
                setSubjects(subjectsData);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (isAdmin && showAdvisorModal) {
            getAllStaff().then(data => {
                setStaffMembers(Array.isArray(data) ? data : []);
            }).catch(console.error);
        }
    }, [isAdmin, showAdvisorModal]);

    const handleAssignAdvisor = async () => {
        if (!selectedAdvisor) return;
        setActionLoading(true);
        try {
            const updatedStudent = await assignAcademicAdvisor(id!, selectedAdvisor);
            setStudent(updatedStudent);
            setShowAdvisorModal(false);
            setSelectedAdvisor("");
        } catch (err) {
            console.error(err);
            alert("Failed to assign academic advisor");
        } finally {
            setActionLoading(false);
        }
    };

    // Calculate completed credit hours and student level
    const completedHours = useMemo(() => {
        if (!student) return 0;
        return student.completedSubjects.reduce((sum, s) => {
            const subject = subjects.find(sub => sub._id === s._id);
            return sum + (subject?.creditHours || 0);
        }, 0);
    }, [student, subjects]);

    const studentLevel = useMemo(() => {
        if (completedHours === 0) return '1';
        if (completedHours <= 30) return '1';
        if (completedHours <= 60) return '2';
        if (completedHours <= 90) return '3';
        return '4';
    }, [completedHours]);

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
                <div className="info-card info-card-level">
                    <span className="info-label">{t("registration.studentLevel")}</span>
                    <span className={`level-badge level-${studentLevel}`}>
                        {t(`registration.level${studentLevel}`)}
                    </span>
                    <span className="info-value-sub" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        ({completedHours} {t("academicHistory.creditHours")})
                    </span>
                </div>
                {student.academicAdvisor && (
                    <div className="info-card">
                        <span className="info-label">Academic Advisor</span>
                        <span className="info-value" style={{ fontSize: '0.85rem' }}>{student.academicAdvisor.name}</span>
                        <span className="info-value-sub" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{student.academicAdvisor.email}</span>
                    </div>
                )}
                {isAdmin && (
                    <div className="info-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                            className="btn btn-add"
                            onClick={() => setShowAdvisorModal(true)}
                        >
                            {student.academicAdvisor ? "Change Advisor" : "Assign Advisor"}
                        </button>
                    </div>
                )}
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

            {/* Assign Academic Advisor Modal */}
            {isAdmin && showAdvisorModal && (
                <div className="modal-overlay" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowAdvisorModal(false);
                        setSelectedAdvisor("");
                    }
                }}>
                    <div className="modal-content" style={{ maxWidth: "500px" }}>
                        <div className="modal-header">
                            <h3>{student.academicAdvisor ? "Change Academic Advisor" : "Assign Academic Advisor"}</h3>
                            <button className="modal-close" onClick={() => {
                                setShowAdvisorModal(false);
                                setSelectedAdvisor("");
                            }} type="button">×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Select Academic Advisor</label>
                                <select
                                    value={selectedAdvisor}
                                    onChange={(e) => setSelectedAdvisor(e.target.value)}
                                    style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                                >
                                    <option value="">Select an advisor...</option>
                                    {staffMembers
                                        .filter(s => s.role === "academic_guide")
                                        .map(s => (
                                            <option key={s._id} value={s._id}>
                                                {s.name} ({s.email})
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => {
                                        setShowAdvisorModal(false);
                                        setSelectedAdvisor("");
                                    }}
                                >
                                    {t("dashboardCommon.cancel")}
                                </button>
                                <button
                                    type="button"
                                    className="submit-btn"
                                    onClick={handleAssignAdvisor}
                                    disabled={actionLoading || !selectedAdvisor}
                                >
                                    {actionLoading ? "Assigning..." : "Assign"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentProfile;