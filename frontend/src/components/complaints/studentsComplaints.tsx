import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, apiPut, getMe, decodeToken } from '../../services/api'; // Adjust path to your api file

interface Complaint {
    _id: string;
    studentName: string;
    studentId: string;
    requestType: string;
    courseName: string;
    problemDescription: string;
    additionalDetails: string;
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
    id: string;
}

const StudentComplaintPage: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editAdditional, setEditAdditional] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'submit' | 'view'>('submit');

    const [formData, setFormData] = useState({
        studentName: '',
        studentId: '',
        requestType: '',
        courseName: '',
        problemDescription: '',
        additionalDetails: ''
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Check if user is authenticated using decodeToken
                const decoded = decodeToken();

                if (!decoded) {
                    navigate('/login');
                    return;
                }

                // Get user details from token
                const userData = await getMe();
                if (!userData) {
                    navigate('/login');
                    return;
                }

                setUser(userData as User);

                const studentIdStr = String(userData.id);

                setFormData(prev => ({
                    ...prev,
                    studentName: userData.name,
                    studentId: studentIdStr
                }));

                fetchComplaints(studentIdStr);
            } catch (err) {
                console.error('Error fetching user:', err);
                navigate('/login');
            }
        };

        fetchUser();
    }, [navigate]);

    const fetchComplaints = async (studentId: string) => {
        try {
            const { res, data } = await apiGet('/complaints');

            if (res.ok) {
                const userComplaints = data.filter((c: Complaint) => String(c.studentId) === String(studentId));
                setComplaints(userComplaints);
            }
        } catch (err) {
            console.error('Error fetching complaints:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage('');

        try {
            const { res, data } = await apiPost('/complaints', formData);

            if (res.ok) {
                setMessage('✅ تم تقديم الطلب بنجاح!');
                setFormData({
                    ...formData,
                    requestType: '',
                    courseName: '',
                    problemDescription: '',
                    additionalDetails: ''
                });
                if (user) {
                    fetchComplaints(String(user.id));
                }
                setActiveTab('view');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('❌ خطأ: ' + (data.message || data.error || 'Unknown error'));
            }
        } catch (err) {
            setMessage('❌ خطأ في الاتصال بالخادم');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (id: string, description: string, additional: string) => {
        try {
            const { res, data } = await apiPut(`/complaints/${id}`, {
                problemDescription: description,
                additionalDetails: additional
            });

            if (res.ok) {
                setMessage('✅ تم تحديث الطلب بنجاح');
                if (user) {
                    fetchComplaints(String(user.id));
                }
                setEditingId(null);
                setEditDescription('');
                setEditAdditional('');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('❌ فشل التحديث: ' + (data.message || data.error));
            }
        } catch (err) {
            setMessage('❌ خطأ في تحديث الطلب');
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
        return (
            <div style={{
                textAlign: 'center',
                padding: '50px',
                fontSize: '18px',
                color: '#666'
            }}>
                ⏳ جاري التحميل...
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', direction: 'rtl' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '10px', color: '#333' }}>
                🎓 نظام الطلبات الأكاديمية
            </h1>
            <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
                مرحباً, <strong>{user.name}</strong> | الرقم الجامعي: <strong>{user.id}</strong>
            </p>

            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '30px',
                borderBottom: '2px solid #e0e0e0',
                paddingBottom: '10px',
                justifyContent: 'center'
            }}>
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
                        fontWeight: 'bold',
                        transition: 'all 0.3s'
                    }}
                >
                    📝 تقديم طلب جديد
                </button>
                <button
                    onClick={() => {
                        setActiveTab('view');
                        if (user) fetchComplaints(String(user.id));
                    }}
                    style={{
                        padding: '10px 24px',
                        backgroundColor: activeTab === 'view' ? '#4CAF50' : 'transparent',
                        color: activeTab === 'view' ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        transition: 'all 0.3s'
                    }}
                >
                    📋 طلباتي ({complaints.length})
                </button>
            </div>

            {message && (
                <div style={{
                    padding: '12px',
                    backgroundColor: message.includes('✅') ? '#e8f5e9' : '#ffebee',
                    color: message.includes('✅') ? '#2e7d32' : '#c62828',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                }}>
                    {message}
                </div>
            )}

            {activeTab === 'submit' && (
                <div style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    padding: '30px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ marginBottom: '20px', color: '#333' }}>تقديم طلب أكاديمي</h2>
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
                            placeholder="نوع الطلب (مثال: انسحاب من مادة، تسجيل مادة من سنة أعلى، تعديل جدول، ...) *"
                            value={formData.requestType}
                            onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                            required
                            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px' }}
                        />

                        <input
                            type="text"
                            placeholder="اسم المادة *"
                            value={formData.courseName}
                            onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                            required
                            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px' }}
                        />

                        <textarea
                            rows={5}
                            placeholder="وصف المشكلة بالتفصيل *"
                            value={formData.problemDescription}
                            onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                            required
                            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px', fontFamily: 'inherit' }}
                        />

                        <textarea
                            rows={3}
                            placeholder="تفاصيل إضافية (اختياري)"
                            value={formData.additionalDetails}
                            onChange={(e) => setFormData({ ...formData, additionalDetails: e.target.value })}
                            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px', fontFamily: 'inherit' }}
                        />

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: submitting ? '#ccc' : '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'view' && (
                <div>
                    {complaints.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '12px'
                        }}>
                            <div style={{ fontSize: '48px' }}>📭</div>
                            <h3 style={{ color: '#333' }}>لا توجد طلبات</h3>
                            <p style={{ color: '#666' }}>لم تقم بتقديم أي طلبات حتى الآن.</p>
                            <button
                                onClick={() => setActiveTab('submit')}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#f39c12',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                📝 تقديم طلب
                            </button>
                        </div>
                    ) : (
                        complaints.map((complaint) => (
                            <div key={complaint._id} style={{
                                marginBottom: '20px',
                                padding: '20px',
                                border: '1px solid #e0e0e0',
                                borderRadius: '12px',
                                backgroundColor: 'white',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '15px',
                                    flexWrap: 'wrap',
                                    gap: '10px'
                                }}>
                                    <div>
                                        <h3 style={{ margin: 0, color: '#333' }}>{complaint.courseName}</h3>
                                        <span style={{ fontSize: '14px', color: '#2196f3' }}>{complaint.requestType}</span>
                                    </div>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        backgroundColor: getStatusColor(complaint.status) + '20',
                                        color: getStatusColor(complaint.status),
                                        fontWeight: 'bold',
                                        fontSize: '14px'
                                    }}>
                                        {getStatusText(complaint.status)}
                                    </span>
                                </div>

                                {editingId === complaint._id ? (
                                    <div>
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            rows={4}
                                            placeholder="وصف المشكلة"
                                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px', fontFamily: 'inherit' }}
                                        />
                                        <textarea
                                            value={editAdditional}
                                            onChange={(e) => setEditAdditional(e.target.value)}
                                            rows={3}
                                            placeholder="تفاصيل إضافية"
                                            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px', fontFamily: 'inherit' }}
                                        />
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => handleUpdate(complaint._id, editDescription, editAdditional)}
                                                style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                            >
                                                💾 حفظ
                                            </button>
                                            <button
                                                onClick={() => { setEditingId(null); setEditDescription(''); setEditAdditional(''); }}
                                                style={{ padding: '8px 16px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                            >
                                                ❌ إلغاء
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                                        <p style={{ margin: '0 0 10px 0' }}><strong>📝 وصف المشكلة:</strong> {complaint.problemDescription}</p>
                                        {complaint.additionalDetails && (
                                            <p style={{ margin: 0 }}><strong>📌 تفاصيل إضافية:</strong> {complaint.additionalDetails}</p>
                                        )}
                                        {complaint.status === 'pending' && (
                                            <button
                                                onClick={() => {
                                                    setEditingId(complaint._id);
                                                    setEditDescription(complaint.problemDescription);
                                                    setEditAdditional(complaint.additionalDetails || '');
                                                }}
                                                style={{
                                                    marginTop: '10px',
                                                    padding: '5px 12px',
                                                    backgroundColor: '#2196f3',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                ✏️ تعديل الطلب
                                            </button>
                                        )}
                                    </div>
                                )}

                                {complaint.adminResponse && (
                                    <div style={{
                                        marginTop: '15px',
                                        padding: '15px',
                                        backgroundColor: '#e8f5e9',
                                        borderRadius: '8px',
                                        borderRight: '4px solid #4CAF50'
                                    }}>
                                        <strong>📨 رد الإدارة:</strong>
                                        <p style={{ margin: '8px 0 0 0' }}>{complaint.adminResponse}</p>
                                        {complaint.reviewedBy && (
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                                                👤 تمت المراجعة بواسطة: {complaint.reviewedBy} في {formatDate(complaint.reviewedAt)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div style={{
                                    marginTop: '15px',
                                    fontSize: '12px',
                                    color: '#999',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '10px'
                                }}>
                                    <span>📅 تاريخ التقديم: {formatDate(complaint.createdAt)}</span>
                                    <span>🆔 رقم الطلب: {complaint._id.slice(-6)}</span>
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