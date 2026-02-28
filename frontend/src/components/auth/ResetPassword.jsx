import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiGet, apiPost } from '../../services/api';
import './css/Login.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); 
    const [verifyError, setVerifyError] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Verify reset token
    useEffect(() => {
        if (!token) {
            setStatus('invalid');
            setVerifyError('رابط إعادة التعيين غير صالح. لم يتم العثور على الرمز.');
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
                    setVerifyError(data.error || 'الرابط منتهي الصلاحية أو غير صالح.');
                }
            } catch {
                if (cancelled) return;
                setStatus('invalid');
                setVerifyError('تعذر التحقق من الرابط. حاول مرة أخرى.');
            }
        };

        verify();
        return () => { cancelled = true; };
    }, [token]);

    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('كلمة السر يجب أن تكون على الأقل 6 أحرف.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('كلمتا السر غير متطابقتين.');
            return;
        }

        setLoading(true);
        try {
            const { res, data } = await apiPost('/auth/reset-password', { token, newPassword });
            if (!res.ok) {
                setError(data.error || 'فشلت عملية إعادة تعيين كلمة السر.');
                return;
            }
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch {
            setError('تعذر التواصل مع السيرفر.');
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
                جامعة القاهرة - كلية العلوم
            </div>
        </div>
    );

    
    const renderMessageCard = (title, message, linkText, linkTo) => (
        <div className="login-form-side">
            <div className="login-card text-center">
                <div className="login-header">
                    <h1>{title}</h1>
                    <p className={status === 'invalid' ? 'text-error' : 'text-success'}>{message}</p>
                </div>
                {linkText && linkTo && (
                    <p className="text-left mt-1">
                        <Link to={linkTo} className="forgot-link">← {linkText}</Link>
                    </p>
                )}
            </div>
        </div>
    );

    
    if (status === 'loading') return (
        <div className="login-page">
            {renderLeftSide()}
            {renderMessageCard('جار التحقق...', 'يرجى الانتظار')}
        </div>
    );

    
    if (status === 'invalid') return (
        <div className="login-page">
            {renderLeftSide()}
            {renderMessageCard('رابط غير صالح', verifyError, 'طلب رابط إعادة تعيين جديد', '/forgot-password')}
        </div>
    );

    
    if (success) return (
        <div className="login-page">
            {renderLeftSide()}
            {renderMessageCard('نجاح العملية', 'تم تحديث كلمة السر بنجاح! يتم التحويل إلى صفحة تسجيل الدخول', 'اذهب إلى تسجيل الدخول', '/login')}
        </div>
    );

    
    return (
        <div className="login-page">
            {renderLeftSide()}
            <div className="login-form-side">
                <div className="login-card">
                    <div className="login-header">
                        <h1>إعادة تعيين كلمة السر</h1>
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
                        {['newPassword', 'confirmPassword'].map((id, idx) => (
                            <div className="form-group" key={id}>
                                <label htmlFor={id}>{idx === 0 ? 'كلمة السر الجديدة' : 'اعد كتابة كلمة السر'}</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input
                                        id={id}
                                        type="password"
                                        value={idx === 0 ? newPassword : confirmPassword}
                                        onChange={(e) => idx === 0 ? setNewPassword(e.target.value) : setConfirmPassword(e.target.value)}
                                        minLength={6}
                                        required
                                        placeholder={idx === 0 ? 'ادخل كلمة السر الجديدة' : 'اعد كتابة كلمة السر الجديدة'}
                                    />
                                </div>
                            </div>
                        ))}
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'تحديث كلمة السر'}
                        </button>
                    </form>
                    <div className="form-footer mt-1-25">
                        <Link to="/login" className="forgot-link">← ارجع إلى تسجيل الدخول</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;