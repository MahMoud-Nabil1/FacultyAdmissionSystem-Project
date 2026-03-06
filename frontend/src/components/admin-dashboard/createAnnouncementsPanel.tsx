import React, { useState, useEffect } from 'react';

interface Announcement {
    _id: string;
    title: string;
    content: string;
    author: string;
    createdAt: string;
}

const API_URL = 'http://localhost:5000/api';

const AnnouncementsPanel = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const [gpaMin, setGpaMin] = useState(2.5);
    const [gpaMax, setGpaMax] = useState(5);
    const [level, setLevel] = useState('1');
    const [gpaError, setGpaError] = useState('');

    const [loading, setLoading] = useState(false);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 5;

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch(`${API_URL}/announcements`);
            if (!res.ok) throw new Error('فشل في جلب الإعلانات');
            const data = await res.json();
            setAnnouncements(data);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/announcements/settings`);
            if (!res.ok) throw new Error('فشل في جلب الإعدادات');
            const data = await res.json();

            const min = Math.min(data.gpaMin, data.gpaMax);
            const max = Math.max(data.gpaMin, data.gpaMax);

            setGpaMin(min);
            setGpaMax(max);
            setLevel(data.level);
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
        fetchSettings();
    }, []);

    useEffect(() => {
        if (gpaMin >= gpaMax) {
            setGpaError('⚠️ خطأ: الحد الأدنى أكبر من أو يساوي الحد الأقصى');
        } else if (gpaMin < 0 || gpaMin > 5 || gpaMax < 0 || gpaMax > 5) {
            setGpaError('⚠️ خطأ: القيم يجب أن تكون بين 0 و 5');
        } else {
            setGpaError('');
        }
    }, [gpaMin, gpaMax]);

    const handleSettingsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (gpaMin >= gpaMax) {
            setGpaError('⚠️ يجب أن يكون الحد الأدنى أصغر من الحد الأقصى');
            return;
        }

        if (gpaMin < 0 || gpaMin > 5 || gpaMax < 0 || gpaMax > 5) {
            setGpaError('⚠️ القيم يجب أن تكون بين 0 و 5');
            return;
        }

        setSettingsLoading(true);

        try {
            const res = await fetch(`${API_URL}/announcements/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gpaMin,
                    gpaMax,
                    level,
                    updatedBy: 'Admin'
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert('✅ تم حفظ الإعدادات بنجاح');
                fetchSettings();
                window.dispatchEvent(new Event('settingsUpdated'));
            } else {
                alert(`❌ ${data.message || 'حدث خطأ'}`);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('❌ حدث خطأ في الاتصال');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            alert('❌ الرجاء إدخال العنوان والمحتوى');
            return;
        }

        setLoading(true);

        try {
            const url = editingId ? `${API_URL}/announcements/${editingId}` : `${API_URL}/announcements`;
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    author: 'Admin'
                })
            });

            const data = await res.json();

            if (res.ok) {
                setTitle('');
                setContent('');
                setEditingId(null);
                fetchAnnouncements();
                alert(editingId ? '✅ تم تعديل الإعلان' : '✅ تم نشر الإعلان');
            } else {
                alert(`❌ ${data.message || 'حدث خطأ'}`);
            }
        } catch (error) {
            console.error('Error submitting:', error);
            alert('❌ حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('⚠️ هل أنت متأكد من حذف هذا الإعلان؟')) return;

        try {
            const res = await fetch(`${API_URL}/announcements/${id}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (res.ok) {
                fetchAnnouncements();
                alert('✅ تم حذف الإعلان');
            } else {
                alert(`❌ ${data.message || 'حدث خطأ'}`);
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('❌ حدث خطأ في الاتصال');
        }
    };

    const handleEdit = (item: Announcement) => {
        setTitle(item.title);
        setContent(item.content);
        setEditingId(item._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setTitle('');
        setContent('');
        setEditingId(null);
    };

    const filtered = announcements.filter(a =>
        a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const current = filtered.slice(start, start + itemsPerPage);

    return (
        <div dir="rtl" style={{
            padding: '20px',
            fontFamily: 'Arial',
            maxWidth: '1200px',
            margin: '0 auto'
        }}>
            <h2 style={{ color: '#333', marginBottom: '30px' }}>لوحة تحكم الإعلانات</h2>

            {/* Settings Section */}
            <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #dee2e6'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>إعدادات المعدل التراكمي والمستوى</h3>

                {gpaError && (
                    <div style={{
                        color: '#dc3545',
                        background: '#f8d7da',
                        padding: '10px',
                        borderRadius: '4px',
                        marginBottom: '15px'
                    }}>
                        {gpaError}
                    </div>
                )}

                <form onSubmit={handleSettingsSubmit}>
                    <div style={{
                        display: 'flex',
                        gap: '20px',
                        flexWrap: 'wrap',
                        marginBottom: '15px'
                    }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                الحد الأدنى للمعدل (0-5)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={gpaMin}
                                onChange={(e) => setGpaMin(parseFloat(e.target.value))}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                الحد الأقصى للمعدل (0-5)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={gpaMax}
                                onChange={(e) => setGpaMax(parseFloat(e.target.value))}
                                required
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                المستوى
                            </label>
                            <select
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    background: 'white'
                                }}
                            >
                                <option value="1">المستوى الأول</option>
                                <option value="2">المستوى الثاني</option>
                                <option value="3">المستوى الثالث</option>
                                <option value="4">المستوى الرابع</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={settingsLoading || gpaError !== ''}
                        style={{
                            background: settingsLoading || gpaError ? '#6c757d' : '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: settingsLoading || gpaError ? 'not-allowed' : 'pointer',
                            fontSize: '16px',
                            opacity: settingsLoading || gpaError ? 0.5 : 1
                        }}
                    >
                        {settingsLoading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                    </button>
                </form>
            </div>

            {/* Add/Edit Form */}
            <div style={{
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #dee2e6'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
                    {editingId ? 'تعديل إعلان' : 'إعلان جديد'}
                </h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="العنوان"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '10px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '16px'
                        }}
                    />
                    <textarea
                        placeholder="المحتوى"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        rows={4}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '10px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            fontSize: '16px',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: loading ? '#6c757d' : (editingId ? '#ffc107' : '#007bff'),
                                color: loading ? 'white' : (editingId ? '#000' : 'white'),
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                opacity: loading ? 0.5 : 1
                            }}
                        >
                            {loading ? 'جاري...' : (editingId ? 'تحديث الإعلان' : 'نشر الإعلان')}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                style={{
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                إلغاء
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="🔍 بحث بالعنوان أو المحتوى..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                }}
                style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '20px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '16px'
                }}
            />

            {/* Table */}
            <div style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '15px 20px',
                    background: '#f8f9fa',
                    borderBottom: '1px solid #dee2e6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0 }}>قائمة الإعلانات ({filtered.length})</h3>
                    {filtered.length > 0 && (
                        <span style={{
                            background: '#e9ecef',
                            padding: '5px 10px',
                            borderRadius: '4px'
                        }}>
                            صفحة {page} من {totalPages}
                        </span>
                    )}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'right' }}>العنوان</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>المحتوى</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>الناشر</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>التاريخ</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>الإجراءات</th>
                    </tr>
                    </thead>
                    <tbody>
                    {current.map(item => (
                        <tr key={item._id} style={{ borderBottom: '1px solid #e9ecef' }}>
                            <td style={{ padding: '12px' }}>{item.title}</td>
                            <td style={{ padding: '12px' }}>{item.content.substring(0, 30)}...</td>
                            <td style={{ padding: '12px' }}>{item.author}</td>
                            <td style={{ padding: '12px' }}>{new Date(item.createdAt).toLocaleDateString('ar-EG')}</td>
                            <td style={{ padding: '12px' }}>
                                <button
                                    onClick={() => handleEdit(item)}
                                    style={{
                                        background: '#ffc107',
                                        color: '#000',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        marginLeft: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    تعديل
                                </button>
                                <button
                                    onClick={() => handleDelete(item._id)}
                                    style={{
                                        background: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    حذف
                                </button>
                            </td>
                        </tr>
                    ))}
                    {current.length === 0 && (
                        <tr>
                            <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                لا توجد إعلانات
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filtered.length > itemsPerPage && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '15px',
                    marginTop: '20px'
                }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: page === 1 ? 'not-allowed' : 'pointer',
                            background: page === 1 ? '#ccc' : '#007bff',
                            color: 'white',
                            fontSize: '14px'
                        }}
                    >
                        → السابق
                    </button>
                    <span style={{ fontWeight: 'bold' }}>{page} / {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: page === totalPages ? 'not-allowed' : 'pointer',
                            background: page === totalPages ? '#ccc' : '#007bff',
                            color: 'white',
                            fontSize: '14px'
                        }}
                    >
                        التالي ←
                    </button>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsPanel;