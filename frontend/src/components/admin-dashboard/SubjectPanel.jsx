import React, { useEffect, useState } from "react";
import {
    getAllSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
} from "../../services/api";
import Pagination from "./pagination";
import { PAGE_SIZE } from "./constants";

const emptyForm = { name: "", creditHours: "", prerequisites: [] };

const SubjectPanel = () => {
    const [subjects, setSubjects] = useState([]);
    const [page, setPage] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState("");

    const load = async () => setSubjects(await getAllSubjects());

    useEffect(() => {
        load();
    }, []);

    const openAdd = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(true);
        setError("");
    };

    const openEdit = (s) => {
        setEditingId(s._id);
        setForm({
            name: s.name,
            creditHours: String(s.creditHours),
            prerequisites: (s.prerequisites || []).map((p) => (typeof p === "object" ? p._id : p)),
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

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        const payload = {
            name: form.name.trim(),
            creditHours: Number(form.creditHours) || 0,
            prerequisites: Array.isArray(form.prerequisites) ? form.prerequisites : [],
        };
        if (!payload.name) {
            setError("اسم المقرر مطلوب");
            return;
        }
        try {
            if (editingId) {
                await updateSubject(editingId, payload);
            } else {
                await createSubject(payload);
            }
            closeForm();
            await load();
        } catch (err) {
            setError(err.message || "حدث خطأ");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("هل تريد حذف هذا المقرر؟")) return;
        try {
            await deleteSubject(id);
            await load();
        } catch (err) {
            alert(err.message || "فشل الحذف");
        }
    };

    const otherSubjects = subjects.filter((s) => s._id !== editingId);
    const slice = subjects.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    const handlePrereqChange = (e) => {
        const selected = Array.from(e.target.selectedOptions, (o) => o.value);
        setForm((f) => ({ ...f, prerequisites: selected }));
    };

    return (
        <div className="dashboard-container">
            <h2>المقررات</h2>

            <button className="add-btn" onClick={openAdd}>
                إضافة مقرر جديد
            </button>

            {showForm && (
                <form className="form" onSubmit={submit}>
                    {error && <p style={{ color: "var(--error, #dc2626)" }}>{error}</p>}
                    <input
                        placeholder="اسم المقرر"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="عدد الساعات المطلوبة لتسجيل هذا المقرر"
                        value={form.creditHours}
                        onChange={(e) => setForm({ ...form, creditHours: e.target.value })}
                    />
                    <div className="form-group">
                        <label>المتطلبات السابقة (اختياري)</label>
                        <select
                            multiple
                            value={form.prerequisites}
                            onChange={handlePrereqChange}
                            style={{ minHeight: 80 }}
                        >
                            {otherSubjects.map((s) => (
                                <option key={s._id} value={s._id}>
                                    {s.name} ({s.creditHours} ساعات)
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button type="submit" className="submit-btn">
                            {editingId ? "حفظ التعديلات" : "إضافة المقرر"}
                        </button>
                        <button type="button" onClick={closeForm} className="copy-btn">
                            إلغاء
                        </button>
                    </div>
                </form>
            )}

            <table>
                <thead>
                    <tr>
                        <th>اسم المقرر</th>
                        <th>عدد الساعات</th>
                        <th>المتطلبات السابقة</th>
                        <th>إجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {slice.map((s) => (
                        <tr key={s._id}>
                            <td>{s.name}</td>
                            <td>{s.creditHours}</td>
                            <td>
                                {(s.prerequisites || [])
                                    .map((p) => (typeof p === "object" ? p.name : p))
                                    .join(", ") || "—"}
                            </td>
                            <td>
                                <button className="copy-btn" onClick={() => openEdit(s)}>
                                    تعديل
                                </button>
                                <button
                                    className="copy-btn"
                                    style={{ marginRight: 8, color: "var(--error, #dc2626)" }}
                                    onClick={() => handleDelete(s._id)}
                                >
                                    حذف
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Pagination page={page} setPage={setPage} total={subjects.length} />
        </div>
    );
};

export default SubjectPanel;
