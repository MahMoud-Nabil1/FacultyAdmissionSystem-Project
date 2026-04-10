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

const AcademicRequestsPage: React.FC = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const token = sessionStorage.getItem("token");

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/api/complaints', {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            setComplaints(data);
            setError('');
        } catch (err) {
            console.error('Error fetching complaints:', err);
            setError('Failed to fetch requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const updateComplaint = async (id: string, status: string) => {
        if (!adminResponse.trim()) {
            alert('Please enter a response');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/complaints/${id}`, {
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
                alert(`Request ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'marked under review'} successfully`);
                fetchComplaints();
                setSelectedComplaint(null);
                setAdminResponse('');
            } else {
                alert('Failed to update');
            }
        } catch (err) {
            alert('Error updating request');
        }
    };

    const deleteComplaint = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this request?')) {
            try {
                const response = await fetch(`http://localhost:5000/api/complaints/${id}`, {
                    method: 'DELETE',
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (response.ok) {
                    alert('Request deleted');
                    fetchComplaints();
                    if (selectedComplaint?._id === id) setSelectedComplaint(null);
                }
            } catch (err) {
                alert('Error deleting');
            }
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
            case 'pending': return 'Pending';
            case 'under_review': return 'Under Review';
            case 'approved': return 'Approved';
            case 'rejected': return 'Rejected';
            default: return status;
        }
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString();

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading requests...</div>;
    if (error) return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;

    return (
        <div className="dashboard-container" style={{ direction: 'ltr' }}>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>🎓 Academic Requests Management</h2>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ background: '#f0f0f0', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>Total:</strong> {complaints.length}
                </div>
                <div style={{ background: '#f0f0f0', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>Pending:</strong> {complaints.filter(c => c.status === 'pending').length}
                </div>
                <div style={{ background: '#f0f0f0', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>Under Review:</strong> {complaints.filter(c => c.status === 'under_review').length}
                </div>
                <div style={{ background: '#f0f0f0', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>Approved:</strong> {complaints.filter(c => c.status === 'approved').length}
                </div>
                <div style={{ background: '#f0f0f0', padding: '10px 20px', borderRadius: '8px' }}>
                    <strong>Rejected:</strong> {complaints.filter(c => c.status === 'rejected').length}
                </div>
            </div>

            {complaints.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '8px' }}>
                    <h3>No Requests</h3>
                    <p style={{ color: '#666', fontSize: '0.95rem' }}>No requests have been submitted yet.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', maxHeight: '500px', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: '15px', textAlign: 'center' }}>Requests ({complaints.length})</h3>
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
                                <h3 style={{ marginBottom: '15px', textAlign: 'center' }}>Respond to Request</h3>
                                <div style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
                                    <p><strong>Student:</strong> {selectedComplaint.studentName}</p>
                                    <p><strong>ID:</strong> {selectedComplaint.studentId}</p>
                                    <p><strong>Type:</strong> {selectedComplaint.requestType}</p>
                                    <p><strong>Course:</strong> {selectedComplaint.courseName}</p>
                                    <p><strong>Problem:</strong> {selectedComplaint.problemDescription}</p>
                                    {selectedComplaint.additionalDetails && (
                                        <p><strong>Details:</strong> {selectedComplaint.additionalDetails}</p>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Admin Response</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Enter your response..."
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <button
                                        className="panel-btn"
                                        onClick={() => updateComplaint(selectedComplaint._id, 'under_review')}
                                    >
                                        Under Review
                                    </button>
                                    <button
                                        className="panel-btn"
                                        onClick={() => updateComplaint(selectedComplaint._id, 'approved')}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className="panel-btn"
                                        onClick={() => updateComplaint(selectedComplaint._id, 'rejected')}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        className="panel-btn"
                                        onClick={() => deleteComplaint(selectedComplaint._id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                <p style={{ fontSize: '1.1rem' }}>Select a request to respond</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicRequestsPage;
