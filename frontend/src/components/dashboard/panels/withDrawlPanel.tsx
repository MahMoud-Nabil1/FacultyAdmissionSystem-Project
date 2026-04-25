import React, { useState, useEffect } from 'react';

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

const WithDrawlPanel: React.FC = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/complaints`);
            const data = await response.json();
            setComplaints(data);
            setError('');
        } catch (err) {
            console.error('Error fetching complaints:', err);
            setError('فشل في جلب الطلبات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const updateComplaint = async (id: string, status: string) => {
        if (!adminResponse.trim()) {
            alert('الرجاء إدخال رد');
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}`}/complaints/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    adminResponse: adminResponse,
                    reviewedBy: 'Admin',
                    reviewedAt: new Date()
                })
            });

            if (response.ok) {
                alert(`تم ${status === 'approved' ? 'الموافقة على' : status === 'rejected' ? 'رفض' : 'مراجعة'} الطلب بنجاح`);
                fetchComplaints();
                setSelectedComplaint(null);
                setAdminResponse('');
            } else {
                alert('فشل في التحديث');
            }
        } catch (err) {
            alert('خطأ في تحديث الطلب');
        }
    };

    const deleteComplaint = async (id: string) => {
        if (window.confirm('هل تريد حذف هذا الطلب؟')) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}`}/complaints/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    alert('تم حذف الطلب');
                    fetchComplaints();
                    if (selectedComplaint?._id === id) {
                        setSelectedComplaint(null);
                    }
                }
            } catch (err) {
                alert('خطأ في الحذف');
            }
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
            case 'pending': return 'قيد الانتظار';
            case 'under_review': return 'قيد المراجعة';
            case 'approved': return 'تمت الموافقة';
            case 'rejected': return 'مرفوض';
            default: return status;
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('ar-EG');
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>جاري تحميل الطلبات...</div>;
    if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', direction: 'rtl' }}>
            <h2>🎓 إدارة الطلبات الأكاديمية</h2>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ background: '#f0f0f0', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>الإجمالي:</strong> {complaints.length}
                </div>
                <div style={{ background: '#fff3e0', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>قيد الانتظار:</strong> {complaints.filter(c => c.status === 'pending').length}
                </div>
                <div style={{ background: '#e3f2fd', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>قيد المراجعة:</strong> {complaints.filter(c => c.status === 'under_review').length}
                </div>
                <div style={{ background: '#e8f5e9', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>تمت الموافقة:</strong> {complaints.filter(c => c.status === 'approved').length}
                </div>
                <div style={{ background: '#ffebee', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>مرفوض:</strong> {complaints.filter(c => c.status === 'rejected').length}
                </div>
            </div>

            {complaints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '8px' }}>
                    <h3>لا توجد طلبات</h3>
                    <p>لم يتم تقديم أي طلبات حتى الآن.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', maxHeight: '500px', overflowY: 'auto' }}>
                        <h3>الطلبات ({complaints.length})</h3>
                        {complaints.map(c => (
                            <div
                                key={c._id}
                                onClick={() => {
                                    setSelectedComplaint(c);
                                    setAdminResponse(c.adminResponse || '');
                                }}
                                style={{
                                    padding: '12px',
                                    marginBottom: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    background: selectedComplaint?._id === c._id ? '#e8f0fe' : 'white'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong>{c.studentName}</strong>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        backgroundColor: getStatusColor(c.status) + '20',
                                        color: getStatusColor(c.status)
                                    }}>
                                        {getStatusText(c.status)}
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{c.studentId} - {c.courseName}</div>
                                <div style={{ fontSize: '12px', color: '#2196f3' }}>{c.requestType}</div>
                                <div style={{ fontSize: '12px', marginTop: '8px' }}>{c.problemDescription.substring(0, 80)}...</div>
                                <div style={{ fontSize: '10px', color: '#999', marginTop: '8px' }}>{formatDate(c.createdAt)}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
                        {selectedComplaint ? (
                            <>
                                <h3>الرد على الطلب</h3>
                                <div style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
                                    <p><strong>الطالب:</strong> {selectedComplaint.studentName}</p>
                                    <p><strong>الرقم الجامعي:</strong> {selectedComplaint.studentId}</p>
                                    <p><strong>نوع الطلب:</strong> {selectedComplaint.requestType}</p>
                                    <p><strong>المادة:</strong> {selectedComplaint.courseName}</p>
                                    <p><strong>وصف المشكلة:</strong> {selectedComplaint.problemDescription}</p>
                                    {selectedComplaint.additionalDetails && (
                                        <p><strong>تفاصيل إضافية:</strong> {selectedComplaint.additionalDetails}</p>
                                    )}
                                </div>

                                <textarea
                                    rows={4}
                                    placeholder="رد الإدارة..."
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                    style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => updateComplaint(selectedComplaint._id, 'under_review')} style={{ flex: 1, padding: '10px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                        قيد المراجعة
                                    </button>
                                    <button onClick={() => updateComplaint(selectedComplaint._id, 'approved')} style={{ flex: 1, padding: '10px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                        موافقة
                                    </button>
                                    <button onClick={() => updateComplaint(selectedComplaint._id, 'rejected')} style={{ flex: 1, padding: '10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                        رفض
                                    </button>
                                    <button onClick={() => deleteComplaint(selectedComplaint._id)} style={{ flex: 1, padding: '10px', background: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                        حذف
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                اختر طلباً للرد عليه
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WithDrawlPanel;