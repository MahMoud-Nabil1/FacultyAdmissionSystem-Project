import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Complaint {
    _id: string;
    studentName: string;
    studentId: string;
    courseName: string;
    withdrawalReason: string;
    complaintText: string;
    status: string;
    adminResponse: string;
    reviewedBy: string;
    reviewedAt: string;
    createdAt: string;
}

interface User {
    name: string;
    studentId: string;
    role: string;
}

const StudentComplaintPage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'submit' | 'view'>('submit');

    const [formData, setFormData] = useState({
        studentName: '',
        studentId: '',
        courseName: '',
        withdrawalReason: '',
        complaintText: ''
    });

    const reasons = [
        { value: 'technical_issues', label: 'مشاكل تقنية' },
        { value: 'medical_emergency', label: 'حالة طبية طارئة' },
        { value: 'refund_issue', label: 'مشكلة استرداد الرسوم' },
        { value: 'schedule_conflict', label: 'تضارب في الجدول' },
        { value: 'other', label: 'أخرى' }
    ];

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch('http://localhost:5000/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.ok) {
                    navigate('/login');
                    return;
                }

                const userData = await response.json();
                setUser(userData);

                setFormData(prev => ({
                    ...prev,
                    studentName: userData.name,
                    studentId: userData.studentId || userData.id
                }));

                fetchComplaints(userData.studentId || userData.id);
            } catch (err) {
                console.error('Error fetching user:', err);
                navigate('/login');
            }
        };

        fetchUser();
    }, [navigate]);

    const fetchComplaints = async (studentId: string) => {
        try {
            const response = await fetch('http://localhost:5000/api/complaints');
            const data = await response.json();
            const userComplaints = data.filter((c: Complaint) => c.studentId === studentId);
            setComplaints(userComplaints);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/api/complaints', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('✅ تم تقديم الشكوى بنجاح!');
                setFormData({
                    ...formData,
                    courseName: '',
                    withdrawalReason: '',
                    complaintText: ''
                });
                if (user) {
                    fetchComplaints(user.studentId || user.id);
                }
                setActiveTab('view');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('❌ خطأ: ' + data.message);
            }
        } catch (err) {
            setMessage('❌ خطأ في الاتصال بالخادم');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (id: string, newText: string) => {
        try {
            const response = await fetch(`http://localhost:5000/api/complaints/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ complaintText: newText })
            });

            if (response.ok) {
                setMessage('✅ تم تحديث الشكوى بنجاح');
                if (user) {
                    fetchComplaints(user.studentId || user.id);
                }
                setEditingId(null);
                setEditText('');
                setTimeout(() => setMessage(''), 3000);
            } else {
                alert('فشل التحديث');
            }
        } catch (err) {
            alert('خطأ في تحديث الشكوى');
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'pending': return '#e67e22';
            case 'under_review': return '#2196f3';
            case 'approved': return '#27ae60';
            case 'rejected': return '#c0392b';
            default: return '#666';
        }
    };

    const getStatusText = (status: string) => {
        switch(status) {
            case 'pending': return '⏳ قيد الانتظار';
            case 'under_review': return '🔍 قيد المراجعة';
            case 'approved': return '✓ تمت الموافقة';
            case 'rejected': return '✗ مرفوض';
            default: return status;
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px' }}>جاري التحميل...</div>;
    }

    if (!user) {
        return null;
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', direction: 'rtl' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>🎓 نظام شكاوى الطلاب</h1>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
                مرحباً, <strong>{user.name}</strong> | الرقم الجامعي: <strong>{user.studentId || user.id}</strong>
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px' }}>
                <button
                    onClick={() => setActiveTab('submit')}
                    style={{
                        padding: '10px 24px',
                        backgroundColor: activeTab === 'submit' ? '#4CAF50' : 'transparent',
                        color: activeTab === 'submit' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    📝 تقديم شكوى جديدة
                </button>
                <button
                    onClick={() => { setActiveTab('view'); if (user) fetchComplaints(user.studentId || user.id); }}
                    style={{
                        padding: '10px 24px',
                        backgroundColor: activeTab === 'view' ? '#4CAF50' : 'transparent',
                        color: activeTab === 'view' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}
                >
                    📋 شكواي ({complaints.length})
                </button>
            </div>

            {message && (
                <div style={{
                    padding: '12px',
                    backgroundColor: message.includes('✅') ? '#e8f5e9' : '#ffebee',
                    color: message.includes('✅') ? '#2e7d32' : '#c62828',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    {message}
                </div>
            )}

            {activeTab === 'submit' && (
                <div style={{ maxWidth: '600px', margin: '0 auto', padding: '30px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <h2 style={{ marginBottom: '20px' }}>تقديم شكوى انسحاب</h2>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="الاسم الكامل *"
                            value={formData.studentName}
                            disabled
                            style={{
                                width: '100%',
                                padding: '10px',
                                marginBottom: '15px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                backgroundColor: '#f5f5f5',
                                color: '#666'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="الرقم الجامعي *"
                            value={formData.studentId}
                            disabled
                            style={{
                                width: '100%',
                                padding: '10px',
                                marginBottom: '15px',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                backgroundColor: '#f5f5f5',
                                color: '#666'
                            }}
                        />
                        <input
                            type="text"
                            placeholder="اسم المادة *"
                            value={formData.courseName}
                            onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                            required
                            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px' }}
                        />
                        <select
                            value={formData.withdrawalReason}
                            onChange={(e) => setFormData({ ...formData, withdrawalReason: e.target.value })}
                            required
                            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px' }}
                        >
                            <option value="">اختر سبب الانسحاب *</option>
                            {reasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <textarea
                            rows={5}
                            placeholder="تفاصيل الشكوى *"
                            value={formData.complaintText}
                            onChange={(e) => setFormData({ ...formData, complaintText: e.target.value })}
                            required
                            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px' }}
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{ width: '100%', padding: '12px', backgroundColor: submitting ? '#ccc' : '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}
                        >
                            {submitting ? 'جاري الإرسال...' : 'إرسال الشكوى'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'view' && (
                <div>
                    {complaints.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
                            <div style={{ fontSize: '48px' }}>📭</div>
                            <h3>لا توجد شكاوى</h3>
                            <p>لم تقم بتقديم أي شكاوى حتى الآن.</p>
                            <button onClick={() => setActiveTab('submit')} style={{ padding: '10px 20px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                تقديم شكوى
                            </button>
                        </div>
                    ) : (
                        complaints.map((complaint) => (
                            <div key={complaint._id} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '12px', backgroundColor: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h3 style={{ margin: 0 }}>{complaint.courseName}</h3>
                                    <span style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: getStatusColor(complaint.status) + '20', color: getStatusColor(complaint.status), fontWeight: 'bold' }}>
                                        {getStatusText(complaint.status)}
                                    </span>
                                </div>

                                {editingId === complaint._id ? (
                                    <div>
                                        <textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            rows={4}
                                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px' }}
                                        />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleUpdate(complaint._id, editText)} style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>حفظ</button>
                                            <button onClick={() => { setEditingId(null); setEditText(''); }} style={{ padding: '8px 16px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>إلغاء</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                        <p style={{ margin: 0 }}>{complaint.complaintText}</p>
                                        {complaint.status === 'pending' && (
                                            <button onClick={() => { setEditingId(complaint._id); setEditText(complaint.complaintText); }} style={{ marginTop: '10px', padding: '5px 12px', backgroundColor: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                                                ✏️ تعديل
                                            </button>
                                        )}
                                    </div>
                                )}

                                {complaint.adminResponse && (
                                    <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '8px', borderLeft: '4px solid #4CAF50' }}>
                                        <strong>📨 رد الإدارة:</strong>
                                        <p style={{ margin: '8px 0 0 0' }}>{complaint.adminResponse}</p>
                                        {complaint.reviewedBy && (
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                                تمت المراجعة بواسطة: {complaint.reviewedBy} في {formatDate(complaint.reviewedAt)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{ marginTop: '15px', fontSize: '12px', color: '#999', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>📅 تاريخ التقديم: {formatDate(complaint.createdAt)}</span>
                                    <span>🆔 رقم الشكوى: {complaint._id.slice(-6)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentComplaintPage;