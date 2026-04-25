import React, {FormEvent, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";

interface Announcement {
    _id: string;
    title: string;
    content: string;
    author: string;
    createdAt: string;
}

const API_URL = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}`;

const AnnouncementsPanel: React.FC = () => {
    const {t, i18n} = useTranslation();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [form, setForm] = useState({title: "", content: ""});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const itemsPerPage = 5;
    const [page, setPage] = useState(1);
    const token = sessionStorage.getItem("token");

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch(`${API_URL}/announcements`);
            if (!res.ok) throw new Error(t("announcements.fetchError"));
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
            setError(t("announcementsAdminPanel.errorRequired"));
            return;
        }

        setLoading(true);
        try {
            const url = editingId ? `${API_URL}/announcements/${editingId}` : `${API_URL}/announcements`;
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {"Content-Type": "application/json", "Authorization": `Bearer ${token}`,},
                body: JSON.stringify({...form, author: "Admin"}),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || t("announcementsAdminPanel.errorGeneric"));
                return;
            }

            setForm({title: "", content: ""});
            setEditingId(null);
            setShowForm(false);
            fetchAnnouncements();
        } catch (err) {
            console.error(err);
            setError(t("announcementsAdminPanel.errorServer"));
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: Announcement) => {
        setForm({title: item.title, content: item.content});
        setEditingId(item._id);
        setShowForm(true);
        window.scrollTo({top: 0, behavior: "smooth"});
    };

    const handleCancel = () => {
        setForm({title: "", content: ""});
        setEditingId(null);
        setShowForm(false);
        setError(null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t("dashboardCommon.confirmDeleteAnnouncement"))) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/announcements/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || t("announcementsAdminPanel.errorGeneric"));
                return;
            }

            fetchAnnouncements();
        } catch (err) {
            console.error(err);
            alert(t("announcementsAdminPanel.errorServer"));
        } finally {
            setLoading(false);
        }
    };

    const filtered = announcements.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const current = filtered.slice(start, start + itemsPerPage);
    const dateLocale = i18n.language === "ar" ? "ar-EG" : "en-US";

    return (
        <div className="dashboard-container">
            <h2>{t("announcementsAdminPanel.title")}</h2>

            {/* Toggle form */}
            <button className="panel-btn" onClick={() => setShowForm(prev => !prev)}>
                {showForm
                    ? t("announcementsAdminPanel.toggleCancel")
                    : editingId
                        ? t("announcementsAdminPanel.toggleEdit")
                        : t("announcementsAdminPanel.toggleAdd")}
            </button>

            {showForm && (
                <form className="form" onSubmit={handleSubmit}>
                    {error && <p className="error">{error}</p>}

                    <input
                        placeholder={t("announcementsAdminPanel.fieldTitlePlaceholder")}
                        value={form.title}
                        onChange={e => setForm({...form, title: e.target.value})}
                    />
                    <textarea
                        placeholder={t("announcementsAdminPanel.fieldContentPlaceholder")}
                        value={form.content}
                        onChange={e => setForm({...form, content: e.target.value})}
                        rows={4}
                    />

                    <button className="submit-btn" disabled={loading}>
                        {loading
                            ? t("announcementsAdminPanel.submitting")
                            : editingId
                                ? t("announcementsAdminPanel.submitUpdate")
                                : t("announcementsAdminPanel.submitCreate")}
                    </button>
                    {editingId && (
                        <button type="button" className="panel-btn" onClick={handleCancel}>
                            {t("dashboardCommon.cancel")}
                        </button>
                    )}
                </form>
            )}

            {/* Search */}
            <input
                placeholder={t("announcementsAdminPanel.searchPlaceholder")}
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
                    <th>{t("dashboardCommon.title")}</th>
                    <th>{t("dashboardCommon.content")}</th>
                    <th>{t("dashboardCommon.publisher")}</th>
                    <th>{t("dashboardCommon.date")}</th>
                    <th>{t("dashboardCommon.actions")}</th>
                </tr>
                </thead>
                <tbody>
                {current.map(a => (
                    <tr key={a._id}>
                        <td>{a.title}</td>
                        <td>{a.content.substring(0, 50)}...</td>
                        <td>{a.author}</td>
                        <td>{new Date(a.createdAt).toLocaleDateString(dateLocale)}</td>
                        <td>
                            <button className="edit-btn"
                                    onClick={() => handleEdit(a)}>{t("dashboardCommon.edit")}</button>
                            <button className="delete-btn"
                                    onClick={() => handleDelete(a._id)}>{t("dashboardCommon.delete")}</button>
                        </td>
                    </tr>
                ))}
                {current.length === 0 && (
                    <tr>
                        <td colSpan={5} style={{textAlign: "center", padding: "20px"}}>
                            {t("announcementsAdminPanel.empty")}
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            {/* Pagination */}
            {filtered.length > itemsPerPage && (
                <div className="pagination">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
                    <span>{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→
                    </button>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsPanel;