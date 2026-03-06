import React, { useState, useEffect, FormEvent } from "react";

interface Announcement {
    _id: string;
    title: string;
    content: string;
    author: string;
    createdAt: string;
}

const API_URL = 'http://localhost:5000/api';

const AnnouncementsPanel: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [form, setForm] = useState({ title: "", content: "" });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const itemsPerPage = 5;
    const [page, setPage] = useState(1);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch(`${API_URL}/announcements`);
            if (!res.ok) throw new Error("فشل في جلب الإعلانات");
            const data = await res.json();
            setAnnouncements(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!form.title.trim() || !form.content.trim()) {
            setError("الرجاء إدخال العنوان والمحتوى");
            return;
        }

        setLoading(true);
        try {
            const url = editingId ? `${API_URL}/announcements/${editingId}` : `${API_URL}/announcements`;
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, author: "Admin" }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "حدث خطأ");
                return;
            }

            setForm({ title: "", content: "" });
            setEditingId(null);
            setShowForm(false);
            fetchAnnouncements();
        } catch (err) {
            console.error(err);
            setError("حدث خطأ في الاتصال");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: Announcement) => {
        setForm({ title: item.title, content: item.content });
        setEditingId(item._id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCancel = () => {
        setForm({ title: "", content: "" });
        setEditingId(null);
        setShowForm(false);
        setError(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;

        try {
            const res = await fetch(`${API_URL}/announcements/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) {
                alert(data.message || "حدث خطأ");
                return;
            }
            fetchAnnouncements();
        } catch (err) {
            console.error(err);
            alert("حدث خطأ في الاتصال");
        }
    };

    const filtered = announcements.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const current = filtered.slice(start, start + itemsPerPage);

    return (
        <div className="dashboard-container">
            <h2>الإعلانات</h2>

            {/* Toggle form */}
            <button className="panel-btn" onClick={() => setShowForm(prev => !prev)}>
                {showForm ? "الغاء" : editingId ? "تعديل الإعلان" : "إضافة إعلان جديد"}
            </button>

            {showForm && (
                <form className="form" onSubmit={handleSubmit}>
                    {error && <p className="error">{error}</p>}

                    <input
                        placeholder="العنوان"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                    />
                    <textarea
                        placeholder="المحتوى"
                        value={form.content}
                        onChange={e => setForm({ ...form, content: e.target.value })}
                        rows={4}
                    />

                    <button className="submit-btn" disabled={loading}>
                        {loading ? "جارٍ..." : editingId ? "تحديث الإعلان" : "نشر الإعلان"}
                    </button>
                    {editingId && (
                        <button type="button" className="panel-btn" onClick={handleCancel}>
                            إلغاء
                        </button>
                    )}
                </form>
            )}

            {/* Search */}
            <input
                placeholder="🔍 بحث بالإعلان..."
                value={searchTerm}
                onChange={e => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                }}
            />

            {/* Table */}
            <table className="panel-table">
                <thead>
                <tr>
                    <th>العنوان</th>
                    <th>المحتوى</th>
                    <th>الناشر</th>
                    <th>التاريخ</th>
                    <th>الإجراءات</th>
                </tr>
                </thead>
                <tbody>
                {current.map(a => (
                    <tr key={a._id}>
                        <td>{a.title}</td>
                        <td>{a.content.substring(0, 50)}...</td>
                        <td>{a.author}</td>
                        <td>{new Date(a.createdAt).toLocaleDateString("ar-EG")}</td>
                        <td>
                            <button className="edit-btn" onClick={() => handleEdit(a)}>تعديل</button>
                            <button className="delete-btn" onClick={() => handleDelete(a._id)}>حذف</button>
                        </td>
                    </tr>
                ))}
                {current.length === 0 && (
                    <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                            لا توجد إعلانات
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            {/* Pagination */}
            {filtered.length > itemsPerPage && (
                <div className="pagination">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← السابق</button>
                    <span>{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>التالي →</button>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsPanel;