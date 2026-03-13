import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './css/announcements.css'; // تم تغيير المسار

const API_URL = 'http://localhost:5000/api';

const Announcements = () => {
    const { t, i18n } = useTranslation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [gpaMin, setGpaMin] = useState(2.5);
    const [gpaMax, setGpaMax] = useState(5);
    const [levelCode, setLevelCode] = useState('1');
    const [posts, setPosts] = useState([]);
    const [logoError, setLogoError] = useState(false);
    const [hasInvalidGpaSettings, setHasInvalidGpaSettings] = useState(false);

    const dateLocale = useMemo(() => (i18n.language === 'ar' ? 'ar-EG' : 'en-US'), [i18n.language]);
    const levelLabel = useMemo(() => {
        const keyByLevel = {
            '1': 'announcements.level1',
            '2': 'announcements.level2',
            '3': 'announcements.level3',
            '4': 'announcements.level4',
        };
        return t(keyByLevel[levelCode] || 'announcements.level1');
    }, [levelCode, t]);

    const fetchData = async () => {
        try {
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                } catch {
                    setUser(userData);
                }
            }

            const [announcementsRes, settingsRes] = await Promise.all([
                fetch(`${API_URL}/announcements`),
                fetch(`${API_URL}/announcements/settings`)
            ]);

            if (!announcementsRes.ok || !settingsRes.ok) {
                throw new Error(t('announcements.fetchError'));
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

            setLevelCode(String(settings.level || '1'));

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="loading-container">{t('announcements.loading')}</div>;
    }

    return (
        <div className="announcements-container">
            {/* Header */}
            <div className="header-wrapper">
                <div>
                    {!logoError && (
                        <img
                            src="/logo.png"
                            alt={t('announcements.logoAlt')}
                            className="logo-img"
                            onError={() => setLogoError(true)}
                        />
                    )}
                </div>
                <div>
                    {!user ? (
                        <button
                            className="login-btn"
                            onClick={() => window.location.href = '/login'}
                        >
                            {t('announcements.loginBtn')}
                        </button>
                    ) : (
                        <span className="user-welcome">
                            {t('announcements.welcome', {
                                name: user?.name ?? '',
                                role: user?.role === 'admin' ? t('announcements.roleAdmin') : t('announcements.roleStudent'),
                            })}
                        </span>
                    )}
                </div>
            </div>

            {/* GPA Section */}
            {hasInvalidGpaSettings ? (
                <div className="gpa-error-section">
                    <h4 className="gpa-error-title">{t('announcements.gpaWarning')}</h4>
                    <p className="gpa-error-text">{t('announcements.gpaErrorText')}</p>
                </div>
            ) : (
                <div className="section-box">
                    <h4 className="section-title">
                        {t('announcements.gpaSectionTitle')}
                    </h4>
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
                </div>
            )}

            {/* Level Section */}
            <div className="section-box">
                <h4 className="section-title">{t('announcements.levelSectionTitle')}</h4>
                <div className="gpa-card" style={{ maxWidth: '300px', margin: '0 auto' }}>
                    <span className="card-value" style={{ color: 'var(--primary)' }}>{levelLabel}</span>
                </div>
            </div>

            {/* Announcements List */}
            <div className="posts-list">
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                    {t('announcements.announcementsTitle')}
                </h3>
                {posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post._id} className="post-card">
                            <h4>{post.title}</h4>
                            <p>{post.content}</p>
                            <small className="post-meta">
                                {t('announcements.postedBy', {
                                    author: post.author,
                                    date: new Date(post.createdAt).toLocaleDateString(dateLocale),
                                })}
                            </small>
                        </div>
                    ))
                ) : (
                    <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                        {t('announcements.noAnnouncements')}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Announcements;