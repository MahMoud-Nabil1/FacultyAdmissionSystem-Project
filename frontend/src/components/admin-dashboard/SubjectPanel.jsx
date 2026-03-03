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
    updateSubject,
} from "../../services/api";

const emptyForm = {
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
            // If already open and not editing, close it
            if (prev && editingId === null) {
                setForm(emptyForm);
                setError("");
                setShowPrereqDropdown(false);
                return false;
            }

            // Otherwise open it in "add mode"
            setEditingId(null);
            setForm(emptyForm);
            setError("");
            setShowPrereqDropdown(false);
            return true;
        });
    };

    const openEdit = (subject) => {
        setEditingId(subject._id);
        setForm({
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

        const name = form.name.trim();
        const credit = Number(form.creditHours);

        if (!name) return setError("اسم المقرر مطلوب");
        if (!Number.isInteger(credit) || credit < 0)
            return setError("عدد الساعات غير صحيح");

        const payload = {
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

    const otherSubjects = useMemo(
        () => subjects.filter((s) => s._id !== editingId),
        [subjects, editingId]
    );

    return (
        <div className="dashboard-container">
            <h2>المقررات</h2>

            <div style={{ display: "flex", gap: 10 }}>
                <button className="add-btn" onClick={openAdd}>
                    إضافة مقرر جديد
                </button>

                <button
                    className="copy-btn"
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
                        placeholder="اسم المقرر"
                        value={form.name}
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                    />

                    <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="عدد الساعات"
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
                                        {s.name}
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