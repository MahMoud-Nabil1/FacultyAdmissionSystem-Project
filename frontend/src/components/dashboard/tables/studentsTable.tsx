import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllStudents, deleteStudent, createStudent } from "../../../services/api";
import Pagination from "../pagination";
import { PAGE_SIZE } from "../../../services/constants";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";

interface Student {
    _id: string;
    studentId: string;
    name: string;
    email: string;
    gpa: string;
}

interface StudentForm {
    studentId: string;
    name: string;
    email: string;
    password: string;
    gpa: string;
}

const StudentsTable: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth(); // Get current logged-in user
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchId, setSearchId] = useState("");
    const [page, setPage] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<StudentForm>({
        studentId: "",
        name: "",
        email: "",
        password: "",
        gpa: "",
    });
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Check if user has admin role
    const isAdmin = user?.role === "admin";

    const loadStudents = async () => {
        try {
            const data = await getAllStudents();
            setStudents(data);
        } catch {
            setError(t("studentPanel.errorGeneric"));
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    useEffect(() => {
        // Filter by ID if search input is provided
        let temp = students;
        if (searchId.trim() !== "") {
            temp = students.filter((s) => s._id.includes(searchId.trim()));
        }
        setFilteredStudents(temp);
        setPage(0); // reset page when filtering
    }, [students, searchId]);

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t("dashboardCommon.confirmDeleteStudent"))) return;
        try {
            await deleteStudent(id);
            setStudents((prev) => prev.filter((s) => s._id !== id));
        } catch {
            setError(t("studentPanel.errorGeneric"));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await createStudent(form);
            setForm({ studentId: "", name: "", email: "", password: "", gpa: "" });
            setShowModal(false);
            await loadStudents(); // Reload the list
        } catch (err: any) {
            if (err.status === 409) {
                setError(t("studentPanel.errorDuplicate"));
            } else {
                setError(err.data?.error || err.message || t("studentPanel.errorGeneric"));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleViewProfile = (id: string) => {
        navigate(`/admin-dashboard/students/${id}`);
    };

    const closeModal = () => {
        setShowModal(false);
        setForm({ studentId: "", name: "", email: "", password: "", gpa: "" });
        setError(null);
    };

    // Pagination slice
    const pagedStudents = filteredStudents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div className="dashboard-container">
            <div className="table-header">
                <h2>{t("studentsTable.title")}</h2>
                {isAdmin && (
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + {t("studentsTable.addNew")}
                    </button>
                )}
            </div>
            {error && <p className="error">{error}</p>}

            {/* Search by ID */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <input
                    type="text"
                    placeholder={t("dashboardCommon.searchById")}
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    style={{ padding: "8px", flex: "1 1 200px" }}
                />
            </div>

            <table className="staff-table">
                <thead>
                <tr>
                    <th>{t("studentsTable.studentCode")}</th>
                    <th>{t("studentsTable.name")}</th>
                    <th>{t("studentsTable.email")}</th>
                    <th>{t("studentsTable.gpa")}</th>
                    <th>{t("studentsTable.getStudent")}</th>
                    {isAdmin && <th>{t("dashboardCommon.delete")}</th>}
                </tr>
                </thead>
                <tbody>
                {pagedStudents.map((s) => (
                    <tr key={s._id}>
                        <td>{s.studentId}</td>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.gpa}</td>
                        <td>
                            <button
                                className="view-btn"
                                onClick={() => handleViewProfile(s._id)}
                            >
                                {t("dashboardCommon.getStudent")}
                            </button>
                        </td>
                        {isAdmin && (
                            <td>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDelete(s._id)}
                                >
                                    {t("dashboardCommon.delete")}
                                </button>
                            </td>
                        )}
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Pagination */}
            <Pagination page={page} setPage={setPage} total={filteredStudents.length} />

            {/* Add Student Modal - Only show if admin */}
            {isAdmin && showModal && (
                <div className="modal-overlay" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeModal();
                }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{t("studentsTable.addNew")}</h3>
                            <button className="modal-close" onClick={closeModal} type="button">×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                {error && <p className="error">{error}</p>}

                                <div className="form-group">
                                    <input
                                        placeholder={t("studentPanel.studentIdPlaceholder")}
                                        value={form.studentId}
                                        onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        placeholder={t("studentPanel.namePlaceholder")}
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="email"
                                        placeholder={t("studentPanel.emailPlaceholder")}
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="5"
                                        placeholder={t("studentPanel.gpaPlaceholder")}
                                        value={form.gpa}
                                        onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="password"
                                        placeholder={t("studentPanel.passwordPlaceholder")}
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="cancel-btn" onClick={closeModal}>
                                        {t("dashboardCommon.cancel")}
                                    </button>
                                    <button type="submit" className="submit-btn" disabled={loading}>
                                        {loading ? t("studentPanel.loadingBtn") : t("studentPanel.submitBtn")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsTable;