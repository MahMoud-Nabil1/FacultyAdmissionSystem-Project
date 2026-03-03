import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import './css/announcements.css';
import Pagination from "./pagination";
import { PAGE_SIZE } from "./constants";

interface AnnouncementForm {
    title: string;
    content: string;
}

interface GPASettings {
    min: number;
    max: number;
}

interface Announcement {
    id: number;
    title: string;
    content: string;
    author: string;
    createdAt: string;
}

const emptyForm = { title: "", content: "" };

// تغيير PAGE_SIZE إلى 2
const ANNOUNCEMENTS_PER_PAGE = 2;

const AnnouncementsPanel: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [page, setPage] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<AnnouncementForm>(emptyForm);
    const [error, setError] = useState("");
    const [gpaSettings, setGpaSettings] = useState<GPASettings>({ min: 2.5, max: 5 });
    const [selectedLevel, setSelectedLevel] = useState<string>('level 1');
    const [gpaError, setGpaError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState("");

    const loadAnnouncements = () => {
        const savedPosts = localStorage.getItem('announcements');
        if (savedPosts) {
            const posts = JSON.parse(savedPosts);
            setAnnouncements(posts);
            // إعادة تعيين الصفحة للصفحة الأولى بعد تحميل البيانات
            setPage(0);
        }
    };

    useEffect(() => {
        const savedGpa = localStorage.getItem('gpaSettings');
        if (savedGpa) {
            const parsedGpa = JSON.parse(savedGpa);
            setGpaSettings(parsedGpa);

            if (parsedGpa.max <= parsedGpa.min) {
                setGpaError("Max GPA must be greater than Min GPA");
            }
        }

        const savedLevel = localStorage.getItem('selectedLevel');
        if (savedLevel) {
            setSelectedLevel(savedLevel);
        }

        loadAnnouncements();
    }, []);

    const openAdd = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(true);
        setError("");
    };

    const openEdit = (announcement: Announcement) => {
        setEditingId(announcement.id);
        setForm({
            title: announcement.title,
            content: announcement.content
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

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleGpaChange = (e: ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
        const value = parseFloat(e.target.value);
        const newSettings = { ...gpaSettings, [type]: value };

        if (type === 'max' && value <= gpaSettings.min) {
            setGpaError("Max GPA must be greater than Min GPA");
        } else if (type === 'min' && gpaSettings.max <= value) {
            setGpaError("Min GPA must be less than Max GPA");
        } else {
            setGpaError(null);
        }

        setGpaSettings(newSettings);
        localStorage.setItem('gpaSettings', JSON.stringify(newSettings));

        if (newSettings.max > newSettings.min) {
            setSuccessMessage("GPA settings saved successfully!");
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    const handleLevelChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedLevel(value);
        localStorage.setItem('selectedLevel', value);
        setSuccessMessage(`Level set to ${value} successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (gpaSettings.max <= gpaSettings.min) {
            setError("Cannot post announcement: Max GPA must be greater than Min GPA");
            return;
        }

        setLoading(true);
        setError("");

        try {
            let updatedAnnouncements;

            if (editingId) {
                updatedAnnouncements = announcements.map(announcement =>
                    announcement.id === editingId
                        ? {
                            ...announcement,
                            title: form.title,
                            content: form.content
                        }
                        : announcement
                );
                setSuccessMessage("Announcement updated successfully!");
            } else {
                const userData = localStorage.getItem('user');
                let author = 'Admin';
                if (userData) {
                    try {
                        const user = JSON.parse(userData);
                        author = user.name || 'Admin';
                    } catch {
                        author = 'Admin';
                    }
                }

                const newPost = {
                    id: Date.now(),
                    title: form.title,
                    content: form.content,
                    author: author,
                    createdAt: new Date().toISOString()
                };
                updatedAnnouncements = [newPost, ...announcements];
                setSuccessMessage("Announcement posted successfully!");
            }

            localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
            setAnnouncements(updatedAnnouncements);

            closeForm();
            // إعادة تعيين الصفحة للصفحة الأولى بعد إضافة إعلان جديد
            setPage(0);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to delete this announcement?')) {
            const updatedAnnouncements = announcements.filter(a => a.id !== id);
            localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
            setAnnouncements(updatedAnnouncements);
            setSuccessMessage("Announcement deleted successfully!");
            // إعادة تعيين الصفحة للصفحة الأولى بعد الحذف
            setPage(0);
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(0);
    };

    const isGpaValid = gpaSettings.max > gpaSettings.min;

    const filteredAnnouncements = announcements.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // عرض بوستين فقط في الصفحة
    const startIndex = page * ANNOUNCEMENTS_PER_PAGE;
    const endIndex = startIndex + ANNOUNCEMENTS_PER_PAGE;
    const slice = filteredAnnouncements.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredAnnouncements.length / ANNOUNCEMENTS_PER_PAGE);
    const currentPageInfo = `${page + 1}/${totalPages || 1}`;

    // دالة للتحقق من وجود صفحة تالية
    const hasNextPage = page < totalPages - 1;
    // دالة للتحقق من وجود صفحة سابقة
    const hasPrevPage = page > 0;

    return (
        <div className="dashboard-container">
            <h2>Announcements & Settings Panel</h2>

            {successMessage && (
                <div style={{
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    border: '1px solid #c3e6cb',
                    fontWeight: 'bold'
                }}>
                    ✅ {successMessage}
                </div>
            )}

            <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "20px" }}>
                <button className="add-btn" onClick={openAdd}>
                    Create New Announcement
                </button>
                <button className="panel-btn" onClick={() => window.location.href = '/announcements'}>
                    View Announcements Page
                </button>
            </div>

            {showForm && (
                <form className="form" onSubmit={handleSubmit}>
                    <h3>{editingId ? 'Edit Announcement' : 'Create New Announcement'}</h3>
                    {error && <p style={{ color: "var(--error, #dc2626)" }}>{error}</p>}

                    <input
                        name="title"
                        placeholder="Announcement Title"
                        value={form.title}
                        onChange={handleChange}
                        required
                    />

                    <textarea
                        name="content"
                        placeholder="Announcement Content"
                        value={form.content}
                        onChange={handleChange}
                        rows={5}
                        required
                        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                    />

                    <div style={{ display: "flex", gap: 8 }}>
                        <button type="submit" className="submit-btn" disabled={loading || !isGpaValid}>
                            {loading ? "Processing..." : (editingId ? "Update Announcement" : "Post Announcement")}
                        </button>
                        <button type="button" onClick={closeForm} className="copy-btn">
                            Cancel
                        </button>
                    </div>

                    {!isGpaValid && (
                        <p style={{ color: 'red', fontSize: '0.9em', marginTop: '5px' }}>
                            ⚠️ Fix GPA settings before posting
                        </p>
                    )}
                </form>
            )}

            {/* GPA Settings */}
            <div className="form" style={{ marginTop: '20px', padding: '15px' }}>
                <h3>GPA Settings</h3>

                {gpaError && (
                    <p style={{ color: 'red', fontWeight: 'bold', backgroundColor: '#ffeeee', padding: '10px', borderRadius: '4px' }}>
                        ⚠️ {gpaError}
                    </p>
                )}

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                        <label>Minimum GPA</label>
                        <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={gpaSettings.min}
                            onChange={(e) => handleGpaChange(e, 'min')}
                            style={{ borderColor: gpaError ? 'red' : undefined }}
                        />
                    </div>
                    <div>
                        <label>Maximum GPA</label>
                        <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={gpaSettings.max}
                            onChange={(e) => handleGpaChange(e, 'max')}
                            style={{ borderColor: gpaError ? 'red' : undefined }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                    <strong>Current Settings:</strong> Min = {gpaSettings.min}, Max = {gpaSettings.max}
                    {isGpaValid ? (
                        <span style={{ color: 'green', marginLeft: '10px' }}>✅ Valid</span>
                    ) : (
                        <span style={{ color: 'red', marginLeft: '10px' }}>❌ Invalid (Max must be {'>'} Min)</span>
                    )}
                </div>
            </div>

            {/* Level Settings */}
            <div className="form" style={{ marginTop: '20px', padding: '15px' }}>
                <h3>Level Settings</h3>
                <select value={selectedLevel} onChange={handleLevelChange} style={{ padding: '8px', width: '200px' }}>
                    <option value="">Choose Level</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                    <option value="4">Level 4</option>
                </select>
            </div>

            {/* Search Bar */}
            <div style={{ marginTop: '30px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="🔍 Search by title or content..."
                    value={searchTerm}
                    onChange={handleSearch}
                    style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '16px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}
                />
            </div>

            {/* Announcements Table with Page Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3>Manage Announcements ({filteredAnnouncements.length} total)</h3>
                {filteredAnnouncements.length > 0 && (
                    <span style={{
                        backgroundColor: '#e0e0e0',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                    }}>
                        {currentPageInfo}
                    </span>
                )}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Title</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Content</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Author</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
                </tr>
                </thead>
                <tbody>
                {slice.map((announcement) => (
                    <tr key={announcement.id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px' }}>{announcement.title}</td>
                        <td style={{ padding: '10px' }}>{announcement.content.substring(0, 50)}...</td>
                        <td style={{ padding: '10px' }}>{announcement.author}</td>
                        <td style={{ padding: '10px' }}>{new Date(announcement.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '10px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => openEdit(announcement)}
                                    style={{
                                        backgroundColor: '#FFC107',
                                        color: '#000',
                                        border: 'none',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    style={{
                                        backgroundColor: '#DC3545',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                    onClick={() => handleDelete(announcement.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                {slice.length === 0 && (
                    <tr>
                        <td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>
                            No announcements found
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            {/* Pagination Controls - Manual if Pagination component not working */}
            {filteredAnnouncements.length > ANNOUNCEMENTS_PER_PAGE && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '20px',
                    marginTop: '20px',
                    padding: '10px'
                }}>
                    <button
                        onClick={() => setPage(prev => Math.max(0, prev - 1))}
                        disabled={!hasPrevPage}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: hasPrevPage ? '#007bff' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: hasPrevPage ? 'pointer' : 'not-allowed'
                        }}
                    >
                        ← Previous
                    </button>

                    <span style={{ fontWeight: 'bold' }}>
                        Page {page + 1} of {totalPages}
                    </span>

                    <button
                        onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={!hasNextPage}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: hasNextPage ? '#007bff' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: hasNextPage ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsPanel;