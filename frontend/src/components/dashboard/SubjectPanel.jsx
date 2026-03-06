import React, {
    useEffect,
    useState,
    useCallback,
    useMemo,
    useRef,
} from "react";
import { useNavigate } from "react-router-dom";
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

        if (!code) return setError("رمز المقرر مطلوب");
        if (!name) return setError("اسم المقرر مطلوب");
        if (!Number.isInteger(credit) || credit < 0)
            return setError("عدد الساعات غير صحيح");

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
            setError(err?.message || "حدث خطأ");
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
            <h2>المقررات</h2>

            <div style={{ display: "flex", gap: 10 }}>
                <button className="panel-btn" onClick={openAdd}>
                    إضافة مقرر جديد
                </button>

                <button
                    className="panel-btn"
                    onClick={() =>
                        navigate(
                            "/admin-dashboard/table?type=subjects"
                        )
                    }
                >
                    عرض جدول المقررات
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
                        placeholder="رمز المقرر (مثال: س202)"
                        value={form.code}
                        onChange={(e) =>
                            setForm({ ...form, code: e.target.value })
                        }
                    />

                    <input
                        placeholder="اسم المقرر (مثال: هياكل البيانات والخوارزميات)"
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                    />

                    <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="عدد الساعات المعتمدة"
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
                        <label>المتطلبات السابقة</label>

                        <button
                            type="button"
                            className="copy-btn"
                            onClick={() =>
                                setShowPrereqDropdown((p) => !p)
                            }
                        >
                            {form.prerequisites.length === 0
                                ? "اختر المتطلبات"
                                : `تم اختيار ${form.prerequisites.length}`}
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
                        حفظ
                    </button>
                </form>
            )}
        </div>
    );
};

export default SubjectPanel;