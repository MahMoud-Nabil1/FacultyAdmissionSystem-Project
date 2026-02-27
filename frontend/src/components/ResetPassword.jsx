import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiPost } from '../services/api';

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

    if (success) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ color: 'green', marginBottom: '1rem' }}>تم تحديث كلمة السر بنجاح! يتم الرجوع الى صفحة تسجيل الدخول</p>
                <Link to="/login">اذهب الى صفحة تسجيل الدخول</Link>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 400, margin: '2rem auto', padding: '1rem' }}>
            <h1>اعادة تعيين كلمة السر</h1>
            <p style={{ marginBottom: '1rem' }}>اكتب كلمة السر الجديدة الخاصة بك</p>
            <form onSubmit={handleSubmit}>
                {error && <p style={{ color: '#c00', marginBottom: '0.5rem' }}>{error}</p>}
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="newPassword">كلمة السر الجديدة</label>
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
                    <label htmlFor="confirmPassword">اعد كتابة كلمة السر</label>
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
                <Link to="/login">ارجع على صفحة تسجيل الدخول</Link>
            </p>
        </div>
    );
};

export default ResetPassword;
