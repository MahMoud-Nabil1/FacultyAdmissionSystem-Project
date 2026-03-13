import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAllSubjects, deleteSubject, createSubject } from "../../../services/api";
import Pagination from "../pagination";
import { PAGE_SIZE } from "../../../services/constants";
import { useTranslation } from "react-i18next";

interface Subject {
    _id: string;
    code: string;
    name: string;
    creditHours: number;
    prerequisites?: any[];
}

interface SubjectForm {
    code: string;
    name: string;
    creditHours: string;
    prerequisites: string[];
}

interface SubjectsTableProps {
    onEdit: (subject: Subject) => void;
}

const SubjectsTable: React.FC<SubjectsTableProps> = ({ onEdit }) => {
    const { t } = useTranslation();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [page, setPage] = useState<number>(0);
    const [search, setSearch] = useState<string>("");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<SubjectForm>({
        code: "",
        name: "",
        creditHours: "",
        prerequisites: [],
    });
    const [error, setError] = useState<string>("");
    const [showPrereqDropdown, setShowPrereqDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const load = async () => {
        const data = await getAllSubjects();
        setSubjects(data);
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowPrereqDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm(t("dashboardCommon.confirmDeleteSubject"))) return;
        await deleteSubject(id);
        await load();
    };

    const togglePrerequisite = (id: string) => {
        setForm((prev) => {
            const exists = prev.prerequisites.includes(id);
            return {
                ...prev,
                prerequisites: exists
                    ? prev.prerequisites.filter((p) => p !== id)
                    : [...prev.prerequisites, id],
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const code = form.code.trim().toUpperCase();
        const name = form.name.trim();
        const credit = Number(form.creditHours);

        if (!code) {
            setError(t("subjectPanel.errorCode"));
            setLoading(false);
            return;
        }
        if (!name) {
            setError(t("subjectPanel.errorName"));
            setLoading(false);
            return;
        }
        if (!Number.isInteger(credit) || credit < 0) {
            setError(t("subjectPanel.errorCreditHours"));
            setLoading(false);
            return;
        }

        const payload = {
            code,
            name,
            creditHours: credit,
            prerequisites: form.prerequisites,
        };

        try {
            await createSubject(payload);
            closeModal();
            await load();
        } catch (err: any) {
            setError(err?.message || t("subjectPanel.errorGeneric"));
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setForm({ code: "", name: "", creditHours: "", prerequisites: [] });
        setError("");
        setShowPrereqDropdown(false);
    };

    // Filter by code or name
    const filteredSubjects = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return subjects;
        return subjects.filter(
            (s) =>
                s.name.toLowerCase().includes(term) ||
                s.code.toLowerCase().includes(term)
        );
    }, [subjects, search]);

    const slice = filteredSubjects.slice(
        page * PAGE_SIZE,
        page * PAGE_SIZE + PAGE_SIZE
    );

    // Reset page when search changes
    useEffect(() => {
        setPage(0);
    }, [search]);

    return (
        <div className="dashboard-container">
            <div className="table-header">
                <h2>{t("subjectsTable.title")}</h2>
                <button className="add-btn" onClick={() => setShowModal(true)}>
                    + {t("subjectsTable.addNew")}
                </button>
            </div>

            {/* ===== Search Bar ===== */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <input
                    type="text"
                    placeholder={t("subjectsTable.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    /* 2. Style matches the other tables' search bars */
                    style={{ padding: "8px", flex: "1 1 200px" }}
                />
            </div>

            {/* 3. Added the staff-table class to fix the alignment and width */}
            <table className="staff-table">
                <thead>
                <tr>
                    <th>{t("subjectsTable.code")}</th>
                    <th>{t("subjectsTable.name")}</th>
                    <th>{t("subjectsTable.creditHours")}</th>
                    <th>{t("subjectsTable.prerequisites")}</th>
                    <th>{t("dashboardCommon.actions")}</th>
                </tr>
                </thead>

                <tbody>
                {slice.map((s) => (
                    <tr key={s._id}>
                        <td>{s.code}</td>
                        <td>{s.name}</td>
                        <td>{s.creditHours}</td>
                        <td>
                            {(s.prerequisites || [])
                                .map((p: any) =>
                                    typeof p === "object" ? p.name + " (" + p.code + ")" : p
                                )
                                .join(", ") || "—"}
                        </td>
                        <td>
                            {/* 4. Using the delete-btn class we styled in CSS */}
                            <button
                                className="delete-btn"
                                onClick={() => handleDelete(s._id)}
                            >
                                {t("dashboardCommon.delete")}
                            </button>
                        </td>
                    </tr>
                ))}

                {slice.length === 0 && (
                    <tr>
                        <td colSpan={5} style={{ textAlign: "center" }}>
                            {t("dashboardCommon.noResults")}
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            <Pagination
                page={page}
                setPage={setPage}
                total={filteredSubjects.length}
            />

            {/* Add Subject Modal */}
            {showModal && (
                <div className="modal-overlay" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeModal();
                }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{t("subjectsTable.addNew")}</h3>
                            <button className="modal-close" onClick={closeModal} type="button">×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                {error && <p className="error">{error}</p>}

                                <div className="form-group">
                                    <input
                                        placeholder={t("subjectPanel.codePlaceholder")}
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <input
                                        placeholder={t("subjectPanel.namePlaceholder")}
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder={t("subjectPanel.creditHoursPlaceholder")}
                                        value={form.creditHours}
                                        onChange={(e) => setForm({ ...form, creditHours: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ position: "relative" }} ref={dropdownRef}>
                                    <label>{t("subjectPanel.prerequisitesLabel")}</label>
                                    <button
                                        type="button"
                                        className="copy-btn"
                                        onClick={() => setShowPrereqDropdown((p) => !p)}
                                        style={{ width: "100%" }}
                                    >
                                        {form.prerequisites.length === 0
                                            ? t("subjectPanel.prerequisitesEmpty")
                                            : t("subjectPanel.prerequisitesSelected", { count: form.prerequisites.length })}
                                    </button>

                                    {showPrereqDropdown && (
                                        <div className="dropdown">
                                            {subjects.map((s) => (
                                                <label key={s._id}>
                                                    <input
                                                        type="checkbox"
                                                        checked={form.prerequisites.includes(s._id)}
                                                        onChange={() => togglePrerequisite(s._id)}
                                                    />
                                                    {s.name} ({s.code})
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="cancel-btn" onClick={closeModal}>
                                        {t("dashboardCommon.cancel")}
                                    </button>
                                    <button type="submit" className="submit-btn" disabled={loading}>
                                        {loading ? t("studentPanel.loadingBtn") : t("subjectPanel.saveBtn")}
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

export default SubjectsTable;