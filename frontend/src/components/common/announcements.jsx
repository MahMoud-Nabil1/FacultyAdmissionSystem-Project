import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './css/announcements.css';

const API_URL = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}`;

const Announcements = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const isRTL = i18n.language === 'ar';
    const [loading, setLoading] = useState(true);
    const [gpaMin, setGpaMin] = useState(2.5);
    const [gpaMax, setGpaMax] = useState(5);
    const [levelCodes, setLevelCodes] = useState(['1']);
    const [posts, setPosts] = useState([]);
    const [logoError, setLogoError] = useState(false);
    const [hasInvalidGpaSettings, setHasInvalidGpaSettings] = useState(false);

    const handleLogout = () => {
        sessionStorage.removeItem('token'); // Changed to sessionStorage
        setUser(null);
        navigate('/login');
    };

    // Get user from token (using sessionStorage)
    const fetchUser = async () => {
        try {
            const token = sessionStorage.getItem('token'); // Changed to sessionStorage
            console.log('Fetching user, token exists:', !!token);

            if (!token) {
                setUser(null);
                return;
            }

            const res = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const userData = await res.json();
                console.log('User fetched:', userData);
                setUser(userData);
            } else {
                sessionStorage.removeItem('token'); // Changed to sessionStorage
                setUser(null);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            setUser(null);
        }
    };

    const fetchData = async () => {
        try {
            const [announcementsRes, settingsRes] = await Promise.all([
                fetch(`${API_URL}/announcements`),
                fetch(`${API_URL}/announcements/settings`)
            ]);

            if (!announcementsRes.ok || !settingsRes.ok) {
                console.error('Failed to fetch');
                return;
            }

            const announcements = await announcementsRes.json();
            const settings = await settingsRes.json();

            setPosts(announcements);

            const min = Math.min(settings.gpaMin, settings.gpaMax);
            const max = Math.max(settings.gpaMin, settings.gpaMax);

            setGpaMin(min);
            setGpaMax(max);

            if (settings.gpaMin >= settings.gpaMax) {
                setHasInvalidGpaSettings(true);
            } else {
                setHasInvalidGpaSettings(false);
            }

            setLevelCodes(Array.isArray(settings.level) ? settings.level : [settings.level || '1']);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch user when component mounts or route changes
    useEffect(() => {
        fetchUser();
        fetchData();
    }, [location.pathname]);

    const getLevelText = (code) => {
        const levels = {
            '1': t('announcements.level1'),
            '2': t('announcements.level2'),
            '3': t('announcements.level3'),
            '4': t('announcements.level4')
        };
        return levels[code] || t('announcements.level1');
    };

    const renderLevels = () => {
        return levelCodes.map((code) => (
            <span key={code} className="level-badge">
                {getLevelText(code)}
            </span>
        ));
    };

    // Navigation handlers (all using sessionStorage)
    const handleHomeClick = () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            navigate('/');
        }
    };

    const handleComplaintsClick = () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else if (user && user.role !== 'student') {
            navigate('/admin-dashboard/requests');
        } else {
            navigate('/students-complaints');
        }
    };

    const handleGroupsClick = () => {
        navigate('/Groups');
    };

    const handleRegisterSubjectsClick = () => {
        const token = sessionStorage.getItem('token'); // Changed to sessionStorage
        if (!token) {
            navigate('/login');
        } else {
            navigate('/register-subjects');
        }
    };

    const handleAcademicHistoryClick = () => {
        const token = sessionStorage.getItem('token'); // Changed to sessionStorage
        if (!token) {
            navigate('/login');
        } else {
            navigate('/academic-history');
        }
    };

    if (loading) {
        return <div className="loading-container">{t('announcements.loading')}</div>;
    }

    const isLoggedIn = user !== null;

    return (
        <div className="announcements-container" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Combined Requirements Section */}
            <div className="combined-requirements-box">
                <h4 className="section-title">{t('announcements.gpaSectionTitle')}</h4>
                <div className="requirements-grid">
                    {/* GPA Requirement */}
                    <div className="requirement-block">
                        <div className="requirement-header">
                            <svg className="requirement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                            </svg>
                            {t('settingsPanel.gpaRangeLabel')}
                        </div>
                        {hasInvalidGpaSettings ? (
                            <div className="gpa-error-section" style={{margin: 0}}>
                                <h4>{t('announcements.gpaWarning')}</h4>
                            </div>
                        ) : (
                            <div className="flex-center-gap">
                                <div className="gpa-card">
                                    <span className="card-label">{t('announcements.gpaFrom')}</span>
                                    <span className="card-value">{gpaMin}</span>
                                </div>
                                <div className="gpa-card">
                                    <span className="card-label">{t('announcements.gpaTo')}</span>
                                    <span className="card-value">{gpaMax}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="requirement-divider"></div>

                    {/* Level Requirement */}
                    <div className="requirement-block">
                        <div className="requirement-header">
                            <svg className="requirement-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                            </svg>
                            {t('announcements.levelSectionTitle')}
                        </div>
                        <div className="levels-container">
                            {renderLevels()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Row */}
            <div className="quick-actions-row" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '2rem 0', flexWrap: 'wrap' }}>
                <button 
                    className="btn-primary" 
                    onClick={() => navigate('/Groups')} 
                    style={{ padding: '0.8rem 2rem', fontSize: '1.1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    {t('announcements.navGroups')}
                </button>
            </div>

            {/* Announcements List */}
            <div className="posts-list">
                <h3>{t('announcements.announcementsTitle')}</h3>
                {posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post._id} className="post-card">
                            <h4>{post.title}</h4>
                            <p>{post.content}</p>
                            <small className="post-meta">
                                {t('announcements.postedBy', { author: post.author, date: new Date(post.createdAt).toLocaleDateString(t('common.locale', { defaultValue: 'ar-EG' })) })}
                            </small>
                        </div>
                    ))
                ) : (
                    <p className="no-announcements">{t('announcements.noAnnouncements')}</p>
                )}
            </div>
        </div>
    );
};

export default Announcements;