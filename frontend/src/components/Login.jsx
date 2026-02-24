import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import {getMe} from "../services/api";

const Login = () => {
    const { login } = useAuth();
    const [role, setRole] = useState('student');
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const isStudent = role === 'student';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isStudent
                ? 'http://localhost:5000/api/auth/login/student'
                : 'http://localhost:5000/api/auth/login/staff';

            const body = isStudent
                ? { studentId: userId, password }
                : { email: userId, password };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'فشل تسجيل الدخول');
                return;
            }

            login(data.token);

            const me = await getMe();

            if (me.role === 'student') {
                navigate('/');
            } else {
                navigate('/admin-dashboard');
            }

        } catch (err) {
            setError('لم يمكن التواصل مع السيرفر');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className={`login-icon ${isStudent ? 'student' : 'staff'}`}>
                        {isStudent ? (
                            /* Graduation cap icon */
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 10l-10-6L2 10l10 6 10-6z" />
                                <path d="M6 12v5c0 0 3 3 6 3s6-3 6-3v-5" />
                                <line x1="22" y1="10" x2="22" y2="16" />
                            </svg>
                        ) : (
                            /* Briefcase icon */
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                        )}
                    </div>
                    <h1>!مرحبًا بك</h1>
                    <p>سجل الدخول ك{isStudent ? 'طالب' : 'موظف'}</p>
                </div>

                {/* ── Role Toggle ── */}
                <div className="role-toggle">
                    <button
                        type="button"
                        className={`role-toggle-btn ${isStudent ? 'active' : ''}`}
                        onClick={() => { setRole('student'); setError(''); }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10l-10-6L2 10l10 6 10-6z" />
                            <path d="M6 12v5c0 0 3 3 6 3s6-3 6-3v-5" />
                        </svg>
                        طالب
                    </button>
                    <button
                        type="button"
                        className={`role-toggle-btn ${!isStudent ? 'active' : ''}`}
                        onClick={() => { setRole('staff'); setError(''); }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                        موظف
                    </button>
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
                            {isStudent ? 'كود الطالب' : 'ايميل الموظف'}
                        </label>
                        <div className="input-wrapper">
                            <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <input
                                id="userId"
                                type="text"
                                placeholder={isStudent ? 'ادخل كود الطلب الخاص بك' : 'ادخل ايميل الموظف الخاص بك'}
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

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? (
                            <span className="spinner"></span>
                        ) : (
                            `سجل الدخول ك${isStudent ? 'طالب' : 'موظف'}`
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;