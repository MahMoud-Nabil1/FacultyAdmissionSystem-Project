import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../services/api';
import './Login.css';

const ForgotPasswordChoice = () => {
    const [option, setOption] = useState(null); // 'faculty' | null
    const [studentId, setStudentId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [facultyResult, setFacultyResult] = useState(null); // 'sent' | 'not_found'

    const handleFacultySubmit = async (e) => {
        e.preventDefault();
        setError('');
        const sid = studentId.trim();
        const num = parseInt(sid, 10);
        if (!sid || Number.isNaN(num) || num <= 0) {
            setError('Please enter a valid Student ID.');
            return;
        }
        setLoading(true);
        try {
            const { res, data } = await apiPost('/auth/forgot-password/faculty-email', { studentId: num });
            if (!res.ok) {
                setError(data.error || 'Something went wrong.');
                return;
            }
            const isSent = data.message === 'message sent to the email';
            setFacultyResult(isSent ? 'sent' : 'not_found');
        } catch (err) {
            setError('Unable to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setOption(null);
        setStudentId('');
        setError('');
        setFacultyResult(null);
    };

    // Success after faculty email submit
    if (facultyResult === 'sent') {
        return (
            <div className="login-page">
                <div className="login-card">
                    <div className="login-header">
                        <h1>Check your email</h1>
                        <p style={{ color: 'var(--success, #22c55e)' }}>Sent successfully to your faculty email.</p>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <Link to="/login" className="forgot-link">Back to login</Link>
                    </p>
                </div>
            </div>
        );
    }

    // Not found after faculty email submit
    if (facultyResult === 'not_found') {
        return (
            <div className="login-page">
                <div className="login-card">
                    <div className="login-header">
                        <h1>Forgot password</h1>
                        <p style={{ color: '#f87171', marginBottom: '1rem' }}>There is no account with this Student ID in the database.</p>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <button type="button" className="forgot-link" onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: 'inherit', font: 'inherit' }}>Try again</button>
                    </p>
                </div>
            </div>
        );
    }

    // Option 1: Faculty email – show SID form
    if (option === 'faculty') {
        return (
            <div className="login-page">
                <div className="login-card">
                    <div className="login-header">
                        <h1>Send to faculty email</h1>
                        <p>Enter your Student ID. We'll send the reset link to your faculty email (SID@std.sci.cu.edu.eg).</p>
                    </div>
                    <form className="login-form" onSubmit={handleFacultySubmit}>
                        {error && (
                            <p style={{ color: '#f87171', marginBottom: '0.75rem', fontSize: '0.9rem' }}>{error}</p>
                        )}
                        <div className="input-wrapper">
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Student ID"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Sending...' : 'Send reset link'}
                        </button>
                    </form>
                    <p style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                        <button type="button" className="forgot-link" onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: 'inherit', font: 'inherit' }}>Back to options</button>
                    </p>
                </div>
            </div>
        );
    }

    // Initial screen: 3 options
    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1>Forgot password</h1>
                    <p>Choose how you want to reset your password:</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                    <button
                        type="button"
                        className="login-btn"
                        onClick={() => setOption('faculty')}
                        style={{ width: '100%' }}
                    >
                        1. Send to faculty email
                    </button>
                    <Link to="/ForgotPassWord" className="login-btn" style={{ textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
                        2. Send to personal email (if found)
                    </Link>
                    <Link to="/ITContact" className="login-btn" style={{ textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
                        3. Contact IT
                    </Link>
                </div>
                <p style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                    <Link to="/login" className="forgot-link">Back to login</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordChoice;
