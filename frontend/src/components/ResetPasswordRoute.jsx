import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiGet } from '../services/api';

/**
 * ResetPasswordRoute — verifies the reset token from the URL before showing the reset form.
 * Use on /reset-password?token=xxx. If token is valid, renders children and passes token as prop.
 */
const ResetPasswordRoute = ({ children }) => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // 'loading' | 'valid' | 'invalid'
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            setError('Invalid reset link. Missing token.');
            return;
        }

        let cancelled = false;
        const verify = async () => {
            try {
                const { res, data } = await apiGet(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
                if (cancelled) return;
                if (res.ok && data.valid) {
                    setStatus('valid');
                } else {
                    setStatus('invalid');
                    setError(data.error || 'Invalid or expired reset link.');
                }
            } catch (err) {
                if (cancelled) return;
                setStatus('invalid');
                setError('Unable to verify link. Please try again.');
            }
        };

        verify();
        return () => { cancelled = true; };
    }, [token]);

    if (status === 'loading') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Verifying reset link...</p>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: '#c00', marginBottom: '1rem' }}>{error}</p>
                <Link to="/forgot-password">Request a new reset link</Link>
            </div>
        );
    }

    return React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, { token }) : child
    );
};

export default ResetPasswordRoute;
