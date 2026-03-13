import React, { useState, FormEvent } from "react";
import { createStudent } from "../../../services/api";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface StudentForm {
    studentId: string;
    name: string;
    email: string;
    password: string;
    gpa: string;
}

const StudentPanel: React.FC = () => {
    const { t } = useTranslation();
    const [form, setForm] = useState<StudentForm>({
        studentId: "",
        name: "",
        email: "",
        password: "",
        gpa: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [showForm, setShowForm] = useState<boolean>(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await createStudent(form);
            setForm({ studentId: "", name: "", email: "", password: "", gpa: "" });
            setShowForm(false);
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

    return (
        <div className="dashboard-container">
            <h2>{t("studentPanel.title")}</h2>

            {/* Toggle form */}
            <button className="panel-btn" onClick={() => setShowForm(prev => !prev)}>
                {showForm ? t("studentPanel.cancelBtn") : t("studentPanel.addBtn")}
            </button>

            {showForm && (
                <form className="form" onSubmit={handleSubmit}>
                    {error && <p className="error">{error}</p>}

                    <input
                        placeholder={t("studentPanel.studentIdPlaceholder")}
                        value={form.studentId}
                        onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                    />
                    <input
                        placeholder={t("studentPanel.namePlaceholder")}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <input
                        placeholder={t("studentPanel.emailPlaceholder")}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <input
                        placeholder={t("studentPanel.gpaPlaceholder")}
                        value={form.gpa}
                        onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                    />
                    <input
                        type="password"
                        placeholder={t("studentPanel.passwordPlaceholder")}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />

                    <button className="submit-btn" disabled={loading}>
                        {loading ? t("studentPanel.loadingBtn") : t("studentPanel.submitBtn")}
                    </button>
                </form>
            )}

            {/* Navigate to students table */}
            <button
                className="panel-btn"
                onClick={() => navigate("/admin-dashboard/table?type=students")}
            >
                {t("studentPanel.viewAllBtn")}
            </button>
        </div>
    );
};

export default StudentPanel;