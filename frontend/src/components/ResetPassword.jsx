import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Reset password form. Must be rendered inside ResetPasswordRoute so it receives token as prop.
 */
const ResetPassword = ({ token }) => {
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || 'Failed to reset password.');
                return;
            }
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError('Unable to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'green', marginBottom: '1rem' }}>Password updated successfully. Redirecting to login...</p>
                <Link to="/login">Go to login</Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 400, margin: '2rem auto', padding: '1rem' }}>
            <h1>Reset password</h1>
            <p style={{ marginBottom: '1rem' }}>Enter your new password below.</p>
            <form onSubmit={handleSubmit}>
                {error && <p style={{ color: '#c00', marginBottom: '0.5rem' }}>{error}</p>}
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="newPassword">New password</label>
                    <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                        required
                        style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="confirmPassword">Confirm password</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                        required
                        style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                    />
                </div>
                <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem' }}>
                    {loading ? 'Updating...' : 'Update password'}
                </button>
            </form>
            <p style={{ marginTop: '1rem' }}>
                <Link to="/login">Back to login</Link>
            </p>
        </div>
    );
};

export default ResetPassword;
