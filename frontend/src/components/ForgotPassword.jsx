import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

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
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: trimmed }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || 'Something went wrong.');
                return;
            }
            setSuccess(true);
        } catch (err) {
            setError('Unable to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="login-page">
                <div className="login-card">
                    <div className="login-header">
                        <h1>Check your email</h1>
                        <p>If an account exists for that email, we sent a password reset link.</p>
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
