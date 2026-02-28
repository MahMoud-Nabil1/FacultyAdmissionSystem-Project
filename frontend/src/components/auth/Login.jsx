import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './css/Login.css';
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from "jwt-decode";

const Login = () => {
    const { login } = useAuth();
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    identifier: userId,
                    password
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'فشل تسجيل الدخول');
                return;
            }

            login(data.token);

            const payload = jwtDecode(data.token);

            if (payload.role) navigate("/admin-dashboard");
            else navigate("/");

        } catch (err) {
            setError('لم يمكن التواصل مع السيرفر');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {}
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

            {}
            <div className="login-form-side">
                <div className="login-card">
                    <div className="login-header">
                        <h1>{'تسجيل الدخول'}</h1>
                        <p>يرجى إدخال بيانات الاعتماد الخاصة بك للوصول.</p>
                    </div>

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

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="userId">
                                كود الطالب او الإيميل
                            </label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <input
                                    id="userId"
                                    type="text"
                                    placeholder='ادخل كود الطالب او الإيميل الخاص بك'
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">كلمة السر</label>
                            <div className="input-wrapper">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="ادخل كلمة السر الخاصة بك"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="form-footer">
                            <Link to="/forgot-password" className="forgot-link">
                                نسيت كلمة السر؟
                            </Link>
                        </div>

                        <div className="form-footer">
                            <Link
                                to="/ITContact"
                                className="support-link"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                تواصل مع الدعم
                            </Link>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? (
                                <span className="spinner"></span>
                            ) : (
                                `سجل الدخول`
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;