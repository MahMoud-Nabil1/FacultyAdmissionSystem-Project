import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import '../common/css/announcements.css';

const GlobalNavbar = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [logoError, setLogoError] = useState(false);

    const isLoggedIn = user !== null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleHomeClick = () => {
        if (!isLoggedIn) {
            navigate('/login');
        } else {
            navigate('/');
        }
    };

    const handleComplaintsClick = () => {
        if (!isLoggedIn) {
            navigate('/login');
        } else if (user.role !== 'student') {
            navigate('/admin-dashboard/requests');
        } else {
            navigate('/students-complaints');
        }
    };

    const handleGroupsClick = () => navigate('/Groups');

    const handleRegisterSubjectsClick = () => {
        if (!isLoggedIn) navigate('/login');
        else navigate('/register-subjects');
    };

    const handleAcademicHistoryClick = () => {
        if (!isLoggedIn) navigate('/login');
        else navigate('/academic-history');
    };

    return (
        <div style={{ width: '100%', position: 'sticky', top: 0, zIndex: 1000 }}>
            <nav className="announcements-navbar" style={{ marginBottom: 0, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
                <div className="navbar-brand">
                    {!logoError && (
                        <img
                            src="/logo.png"
                            alt={t('announcements.logoAlt')}
                            className="logo-img"
                            onError={() => setLogoError(true)}
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate('/announcements')}
                        />
                    )}
                </div>

                <div className="navbar-links">
                    {isLoggedIn && (
                        <button className="nav-link" onClick={handleHomeClick}>
                            {t('announcements.navProfile')}
                        </button>
                    )}
                    {isLoggedIn && (
                        <button className="nav-link" onClick={handleComplaintsClick}>
                            {t('announcements.navComplaints')}
                        </button>
                    )}
                    {isLoggedIn && user?.role === 'student' && (
                        <>
                            <button className="nav-link" onClick={handleRegisterSubjectsClick}>
                                {t('announcements.navRegister')}
                            </button>
                            <button className="nav-link" onClick={handleAcademicHistoryClick}>
                                {t('announcements.navHistory')}
                            </button>
                        </>
                    )}
                    {user?.role !== 'student' && isLoggedIn && (
                        <button className="nav-link" onClick={() => navigate('/admin-dashboard')}>
                            {t('announcements.navAdmin')}
                        </button>
                    )}
                </div>

                <div className="navbar-actions">
                    <button 
                        className="btn-lang-toggle" 
                        onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: '#333' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        {i18n.language === 'ar' ? 'EN' : 'عربي'}
                    </button>

                    {!isLoggedIn ? (
                        <button className="btn-primary" onClick={() => navigate('/login')}>
                            {t('announcements.loginBtn')}
                        </button>
                    ) : (
                        <div className="user-profile">
                            <span className="welcome-text">{t('announcements.welcome', { name: user.name, role: t(`roles.${user.role}`) })}</span>
                            <button onClick={handleLogout} className="btn-danger">
                                {t('announcements.logoutBtn')}
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default GlobalNavbar;
