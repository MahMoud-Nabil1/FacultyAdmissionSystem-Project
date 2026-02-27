import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost } from '../../services/api';
import './css/Login.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // 'loading' | 'valid' | 'invalid'
    const [verifyError, setVerifyError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            setVerifyError('Invalid reset link. Missing token.');
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
                    setVerifyError(data.error || 'Invalid or expired reset link.');
                }
            } catch (err) {
                if (cancelled) return;
                setStatus('invalid');
                setVerifyError('Unable to verify link. Please try again.');
            }
        };

        verify();
        return () => { cancelled = true; };
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) {
            setError('كلمة السر يجب ان تكون على الأقل من ستة احرف');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('كلمتا السر ليسا متشابهان');
            return;
        }
        setLoading(true);
        try {
            const { res, data } = await apiPost('/auth/reset-password', { token, newPassword });
            if (!res.ok) {
                setError(data.error || 'فشلت عملية اعادة تعيين كلمة السر');
                return;
            }
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError('لم يمكن التواصل مع السيرفر');
        } finally {
            setLoading(false);
        }
    };

    const renderLeftSide = () => (
        <div className="login-image-side">
            <div className="brand-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10l-10-6L2 10l10 6 10-6z" />
                    <path d="M6 12v5c0 0 3 3 6 3s6-3 6-3v-5" />
                    <line x1="22" y1="10" x2="22" y2="16" />
                </svg>
                STATE UNIVERSITY
            </div>
            <div className="image-content">
                <h1>Shaping the future, one student at a time.</h1>
                <p>Access the faculty portal to manage admissions, courses, and student records efficiently and securely.</p>
            </div>
        </div>
    );

    if (status === 'loading') {
        return (
            <div className="login-page">
                {renderLeftSide()}
                <div className="login-form-side">
                    <div className="login-card text-center">
                        <div className="spinner spinner-centered"></div>
                        <p>Verifying reset link...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'invalid') {
        return (
            <div className="login-page">
                {renderLeftSide()}
                <div className="login-form-side">
                    <div className="login-card">
                        <div className="login-header">
                            <h1>Invalid Link</h1>
                            <p className="text-error mb-1">{verifyError}</p>
                        </div>
                        <p className="text-left mt-1">
                            <Link to="/forgot-password" className="forgot-link">← Request a new reset link</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="login-page">
                {renderLeftSide()}
                <div className="login-form-side">
                    <div className="login-card">
                        <div className="login-header">
                            <h1>نجاح العملية</h1>
                            <p className="text-success">تم تحديث كلمة السر بنجاح! يتم الرجوع الى صفحة تسجيل الدخول</p>
                        </div>
                        <p className="text-left mt-1">
                            <Link to="/login" className="forgot-link">← اذهب الى صفحة تسجيل الدخول</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            {renderLeftSide()}
            <div className="login-form-side">
                <div className="login-card">
                    <div className="login-header">
                        <h1>اعادة تعيين كلمة السر</h1>
                        <p>اكتب كلمة السر الجديدة الخاصة بك</p>
                    </div>
                    <form className="login-form" onSubmit={handleSubmit}>
                        {error && (
                            <div className="login-error">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="form-group">
                            <label htmlFor="newPassword">كلمة السر الجديدة</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={6}
                                    required
                                    placeholder="ادخل كلمة السر الجديدة"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">اعد كتابة كلمة السر</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    minLength={6}
                                    required
                                    placeholder="اعد كتابة كلمة السر الجديدة"
                                />
                            </div>
                        </div>
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Update password'}
                        </button>
                    </form>
                    <div className="form-footer mt-1-25">
                        <Link to="/login" className="forgot-link">← ارجع على صفحة تسجيل الدخول</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
