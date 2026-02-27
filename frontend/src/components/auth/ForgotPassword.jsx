import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiPost } from '../../services/api';
import './css/Login.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'sent' | 'not_found'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) {
            setError('البريد الإلكتروني مطلوب.');
            return;
        }
        setLoading(true);
        try {
            const { res, data } = await apiPost('/auth/forgot-password', { email: trimmed });
            if (!res.ok) {
                setError(data.error || 'حدث خطأ ما.');
                return;
            }
            setStatus(data.message === 'message sent to the email' ? 'sent' : 'not_found');
        } catch {
            setError('تعذر التواصل مع السيرفر.');
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = () => {
        if (status === 'sent') {
            return <p className="text-success">تم إرسال الرابط بنجاح إلى بريدك الإلكتروني.</p>;
        }
        if (status === 'not_found') {
            return <p className="text-error">لا يوجد حساب مرتبط بهذا البريد الإلكتروني.</p>;
        }
        return <p>ادخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.</p>;
    };

    return (
        <div className="login-page">
            {/* ── Left Side (Image & Brand) ── */}
            <div className="login-image-side">
                <div className="brand-logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10l-10-6L2 10l10 6 10-6z" />
                        <path d="M6 12v5c0 0 3 3 6 3s6-3 6-3v-5" />
                        <line x1="22" y1="10" x2="22" y2="16" />
                    </svg>
                    جامعة القاهرة - كلية العلوم
                </div>
            </div>

            {/* ── Right Side (Form) ── */}
            <div className="login-form-side">
                <div className="login-card">
                    <div className="login-header">
                        <h1>نسيت كلمة المرور</h1>
                        {renderMessage()}
                    </div>

                    {status === null && (
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
                                <label htmlFor="email">البريد الإلكتروني</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="أدخل بريدك الإلكتروني"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="login-btn" disabled={loading}>
                                {loading ? <span className="spinner"></span> : 'إرسال رابط إعادة التعيين'}
                            </button>
                        </form>
                    )}

                    {status && (
                        <p className="text-left mt-1">
                            <Link to="/login" className="forgot-link">← العودة لتسجيل الدخول</Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;