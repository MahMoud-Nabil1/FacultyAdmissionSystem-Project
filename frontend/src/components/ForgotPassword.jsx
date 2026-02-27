import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../services/api';
import './Login.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successResult, setSuccessResult] = useState(null); // 'sent' | 'not_found'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            setError('Email is required.');
            return;
        }
        setLoading(true);
        try {
            const { res, data } = await apiPost('/auth/forgot-password', { email: trimmed });
            if (!res.ok) {
                setError(data.error || 'Something went wrong.');
                return;
            }
            const isSent = data.message === 'message sent to the email';
            setSuccessResult(isSent ? 'sent' : 'not_found');
        } catch (err) {
            setError('Unable to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    if (successResult === 'sent') {
        return (
            <div className="login-page">
                <div className="login-card">
                    <div className="login-header">
                        <h1>Success!</h1>
                        <p style={{ color: 'var(--success, #22c55e)' }}>Sent successfully.</p>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <Link to="/login" className="forgot-link">Back to login</Link>
                    </p>
                </div>
            </div>
        );
    }

    if (successResult === 'not_found') {
        return (
            <div className="login-page">
                <div className="login-card">
                    <div className="login-header">
                        <h1>Forgot password</h1>
                        <p style={{ color: '#f87171', marginBottom: '1rem' }}>There is no account with this email in the database.</p>
                    </div>
                    <p style={{ textAlign: 'center', marginTop: '1rem' }}>
                        <Link to="/login" className="forgot-link">Back to login</Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <h1>Forgot password</h1>
                    <p>Enter your email and we'll send you a reset link.</p>
                </div>
                <form className="login-form" onSubmit={handleSubmit}>
                    {error && (
                        <p style={{ color: '#f87171', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                            {error}
                        </p>
                    )}
                    <div className="input-wrapper">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Sending...' : 'Send reset link'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                    <Link to="/login" className="forgot-link">Back to login</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
