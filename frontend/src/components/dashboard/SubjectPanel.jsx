import React, {
    useEffect,
    useState,
    useCallback,
    useMemo,
    useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    getAllSubjects,
    createSubject,
    updateSubject, deleteSubject,
} from "../../services/api";
import SubjectsTable from "./tables/subjectsTable.tsx";


const emptyForm = {
    code: "",
    name: "",
    creditHours: "",
    prerequisites: [],
};

const SubjectPanel = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [subjects, setSubjects] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState("");
    const [showPrereqDropdown, setShowPrereqDropdown] = useState(false);

    const dropdownRef = useRef(null);

    const load = useCallback(async () => {
        const data = await getAllSubjects();
        setSubjects(data);
    }, []);

    const handleEdit = (subject) => {
        openEdit(subject);
    };

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowPrereqDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
    }, []);

    const openAdd = () => {
        setShowForm((prev) => {
            // If form is already open in add mode, close it
            if (prev && editingId === null) {
                setForm(emptyForm);
                setError("");
                setShowPrereqDropdown(false);
                return false;
            }

            // Open in add mode
            setEditingId(null);
            setForm(emptyForm);
            setError("");
            setShowPrereqDropdown(false);
            return true;
        });
    };

    //to edit existing subjects
    const openEdit = (subject) => {
        setEditingId(subject._id);
        setForm({
            code: subject.code || "",
            name: subject.name,
            creditHours: String(subject.creditHours),
            prerequisites: (subject.prerequisites || []).map((p) =>
                typeof p === "object" ? p._id : p
            ),
        });
        setShowForm(true);
        setError("");
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setError("");
    };

    const togglePrerequisite = (id) => {
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

    const submit = async (e) => {
        e.preventDefault();
        setError("");

        const code = form.code.trim().toUpperCase();
        const name = form.name.trim();
        const credit = Number(form.creditHours);

        if (!code) return setError(t("subjectPanel.errorCode"));
        if (!name) return setError(t("subjectPanel.errorName"));
        if (!Number.isInteger(credit) || credit < 0)
            return setError(t("subjectPanel.errorCreditHours"));

        const payload = {
            code,
            name,
            creditHours: credit,
            prerequisites: form.prerequisites,
        };

        try {
            if (editingId) {
                await updateSubject(editingId, payload);
            } else {
                await createSubject(payload);
            }

            closeForm();
            await load();
        } catch (err) {
            setError(err?.message || t("subjectPanel.errorGeneric"));
        }
    };

    const otherSubjects = subjects.filter((s) => s._id !== editingId);

    const handlePrereqChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, (option) => option.value).filter(
            (id) => id !== ""
        );
        setForm((f) => ({ ...f, prerequisites: selected }));
    };

    return (
        <div className="dashboard-container">
            <h2>{t("subjectPanel.title")}</h2>

            <div style={{ display: "flex", gap: 10 }}>
                <button className="panel-btn" onClick={openAdd}>
                    {t("subjectPanel.addBtn")}
                </button>

                <button
                    className="panel-btn"
                    onClick={() =>
                        navigate(
                            "/admin-dashboard/table?type=subjects"
                        )
                    }
                >
                    {t("subjectPanel.viewTableBtn")}
                </button>
            </div>

            {showForm && (
                <form className="form" onSubmit={submit}>
                    {error && (
                        <p style={{ color: "var(--error, #dc2626)" }}>
                            {error}
                        </p>
                    )}

                    <input
                        placeholder={t("subjectPanel.codePlaceholder")}
                        value={form.code}
                        onChange={(e) =>
                            setForm({ ...form, code: e.target.value })
                        }
                    />

                    <input
                        placeholder={t("subjectPanel.namePlaceholder")}
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                    />

                    <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder={t("subjectPanel.creditHoursPlaceholder")}
                        value={form.creditHours}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                creditHours: e.target.value,
                            })
                        }
                    />

                    <div
                        className="form-group"
                        style={{ position: "relative" }}
                        ref={dropdownRef}
                    >
                        <label>{t("subjectPanel.prerequisitesLabel")}</label>

                        <button
                            type="button"
                            className="copy-btn"
                            onClick={() =>
                                setShowPrereqDropdown((p) => !p)
                            }
                        >
                            {form.prerequisites.length === 0
                                ? t("subjectPanel.prerequisitesEmpty")
                                : t("subjectPanel.prerequisitesSelected", { count: form.prerequisites.length })}
                        </button>

                        {showPrereqDropdown && (
                            <div className="dropdown">
                                {otherSubjects.map((s) => (
                                    <label key={s._id}>
                                        <input
                                            type="checkbox"
                                            checked={form.prerequisites.includes(
                                                s._id
                                            )}
                                            onChange={() =>
                                                togglePrerequisite(
                                                    s._id
                                                )
                                            }
                                        />
                                        {s.name} ({s.code})
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <button type="submit" className="submit-btn">
                        {t("subjectPanel.saveBtn")}
                    </button>
                </form>
            )}
        </div>
    );
};

export default SubjectPanel;