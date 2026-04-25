import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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

const AcademicRequestsPage: React.FC = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const token = sessionStorage.getItem("token");
    const { t } = useTranslation();

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/complaints`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            setComplaints(data);
            setError('');
        } catch (err) {
            console.error('Error fetching complaints:', err);
            setError(t('complaints.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const updateComplaint = async (id: string, status: string) => {
        if (!adminResponse.trim()) {
            alert(t('complaints.enterResponse'));
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}`}/complaints/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    status,
                    adminResponse: adminResponse,
                    reviewedBy: 'Admin',
                    reviewedAt: new Date()
                })
            });

            if (response.ok) {
                alert(t('complaints.updateSuccess'));
                fetchComplaints();
                setSelectedComplaint(null);
                setAdminResponse('');
            } else {
                alert(t('complaints.updateError'));
            }
        } catch (err) {
            alert(t('complaints.updateError'));
        }
    };

    const deleteComplaint = async (id: string) => {
        if (!window.confirm(t('complaints.confirmDeleteRequest'))) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}`}/complaints/${id}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                alert(t('complaints.deleteSuccess'));
                fetchComplaints();
                if (selectedComplaint?._id === id) setSelectedComplaint(null);
            } else {
                alert(t('complaints.deleteError'));
            }
        } catch (err) {
            alert(t('complaints.deleteError'));
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#e67e22';
            case 'under_review': return '#2196f3';
            case 'approved': return '#27ae60';
            case 'rejected': return '#c0392b';
            default: return '#666';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return t('complaints.pending');
            case 'under_review': return t('complaints.underReview');
            case 'approved': return t('complaints.approved');
            case 'rejected': return t('complaints.rejected');
            default: return status;
        }
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString();

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>{t('complaints.loading')}</div>;
    if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

    return (
        <div className="dashboard-container" style={{ direction: 'ltr' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>🎓 {t('complaints.adminPanelTitle')}</h2>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ background: '#f0f0f0', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>{t('complaints.total')}</strong> {complaints.length}
                </div>
                <div style={{ background: '#f0f0f0', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>{t('complaints.pending')}</strong> {complaints.filter(c => c.status === 'pending').length}
                </div>
                <div style={{ background: '#f0f0f0', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>{t('complaints.underReview')}</strong> {complaints.filter(c => c.status === 'under_review').length}
                </div>
                <div style={{ background: '#f0f0f0', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>{t('complaints.approved')}</strong> {complaints.filter(c => c.status === 'approved').length}
                </div>
                <div style={{ background: '#f0f0f0', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>{t('complaints.rejected')}</strong> {complaints.filter(c => c.status === 'rejected').length}
                </div>
            </div>

            {complaints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '8px' }}>
                    <h3>{t('complaints.noComplaints')}</h3>
                    <p style={{ color: '#666', fontSize: '0.95rem' }}>{t('complaints.noComplaintsDesc')}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', maxHeight: '500px', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '15px', textAlign: 'center' }}>{t('complaints.requestsListTitle', { count: complaints.length })}</h3>
                        {complaints.map(c => (
                            <div
                                key={c._id}
                                onClick={() => { setSelectedComplaint(c); setAdminResponse(c.adminResponse || ''); }}
                                style={{
                                    padding: '12px', marginBottom: '10px', border: '1px solid #ddd',
                                    borderRadius: '8px', cursor: 'pointer',
                                    background: selectedComplaint?._id === c._id ? '#e8f0fe' : 'white',
                                    transition: 'background 0.2s ease'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong>{c.studentName}</strong>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '12px', fontSize: '12px',
                                        backgroundColor: getStatusColor(c.status) + '20', color: getStatusColor(c.status)
                                    }}>
                                        {getStatusText(c.status)}
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#666' }}>{t('complaints.studentId')}: {c.studentId} • {t('complaints.courseName')}: {c.courseName}</div>
                                <div style={{ fontSize: '12px', color: '#2196f3' }}>{t('complaints.requestType')}: {c.requestType}</div>
                                <div style={{ fontSize: '12px', marginTop: '8px' }}>{c.problemDescription.substring(0, 80)}...</div>
                                <div style={{ fontSize: '10px', color: '#999', marginTop: '8px' }}>{formatDate(c.createdAt)}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
                        {selectedComplaint ? (
                            <>
                                <h3 style={{ marginBottom: '15px', textAlign: 'center' }}>{t('complaints.respondToRequest')}</h3>
                                <div style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
                                    <p><strong>{t('complaints.studentName')}:</strong> {selectedComplaint.studentName}</p>
                                    <p><strong>{t('complaints.studentId')}:</strong> {selectedComplaint.studentId}</p>
                                    <p><strong>{t('complaints.requestType')}:</strong> {selectedComplaint.requestType}</p>
                                    <p><strong>{t('complaints.courseName')}:</strong> {selectedComplaint.courseName}</p>
                                    <p><strong>{t('complaints.problemDescription')}:</strong> {selectedComplaint.problemDescription}</p>
                                    {selectedComplaint.additionalDetails && (
                                        <p><strong>{t('complaints.additionalDetails')}:</strong> {selectedComplaint.additionalDetails}</p>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>{t('complaints.adminResponse')}</label>
                                    <textarea
                                        rows={4}
                                        placeholder={t('complaints.responsePlaceholder')}
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <button
                                        className="panel-btn"
                                        onClick={() => updateComplaint(selectedComplaint._id, 'under_review')}
                                    >
                                        {t('complaints.markUnderReviewBtn')}
                                    </button>
                                    <button
                                        className="panel-btn"
                                        onClick={() => updateComplaint(selectedComplaint._id, 'approved')}
                                    >
                                        {t('complaints.approveBtn')}
                                    </button>
                                    <button
                                        className="panel-btn"
                                        onClick={() => updateComplaint(selectedComplaint._id, 'rejected')}
                                    >
                                        {t('complaints.rejectBtn')}
                                    </button>
                                    <button
                                        className="panel-btn"
                                        onClick={() => deleteComplaint(selectedComplaint._id)}
                                    >
                                        {t('dashboardCommon.delete')}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                <p style={{ fontSize: '1.1rem' }}>{t('complaints.selectRequestToRespond')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicRequestsPage;
