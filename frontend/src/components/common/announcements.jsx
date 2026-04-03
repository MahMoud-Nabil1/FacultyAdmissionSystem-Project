import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/announcements.css';

const API_URL = 'http://localhost:5000/api';

const Announcements = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [gpaMin, setGpaMin] = useState(2.5);
    const [gpaMax, setGpaMax] = useState(5);
    const [levelCode, setLevelCode] = useState('1');
    const [posts, setPosts] = useState([]);
    const [logoError, setLogoError] = useState(false);
    const [hasInvalidGpaSettings, setHasInvalidGpaSettings] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate('/login');
    };

    // Get user from token
    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('token');
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
                setUser(userData);
            } else {
                localStorage.removeItem('token');
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
                throw new Error('Failed to fetch');
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
        fetchUser();
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    const getLevelText = (code) => {
        const levels = {
            '1': 'المستوى الأول',
            '2': 'المستوى الثاني',
            '3': 'المستوى الثالث',
            '4': 'المستوى الرابع'
        };
        return levels[code] || 'المستوى الأول';
    };

    // Navigation handlers
    const handleHomeClick = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            navigate('/');
        }
    };

    const handleComplaintsClick = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        } else {
            navigate('/complaint');
        }
    };

    const handleGroupsClick = () => {
        navigate('/Groups');
    };

    if (loading) {
        return <div className="loading-container">جاري التحميل...</div>;
    }

    const isLoggedIn = user !== null;

    return (
        <div className="announcements-container">
            {/* Header */}
            <div className="header-wrapper">
                <div>
                    {!logoError && (
                        <img
                            src="/logo.png"
                            alt="الشعار"
                            className="logo-img"
                            onError={() => setLogoError(true)}
                        />
                    )}
                </div>
                <div>
                    {!isLoggedIn ? (
                        <button className="login-btn" onClick={() => navigate('/login')}>
                            تسجيل الدخول
                        </button>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span className="user-welcome">مرحباً, {user.name}</span>
                            <button onClick={handleLogout} className="logout-btn">
                                تسجيل الخروج
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="nav-buttons">
                <button className="btn home-btn" onClick={handleHomeClick}>
                    🏠 الرئيسية
                </button>
                <button className="btn complaint-btn" onClick={handleComplaintsClick}>
                    📝 الشكاوى
                </button>
                <button className="btn groups-btn" onClick={handleGroupsClick}>
                    👥 المجموعات
                </button>
                {user?.role === 'admin' && (
                    <button className="btn admin-btn" onClick={() => navigate('/admin-dashboard')}>
                        ⚙️ لوحة التحكم
                    </button>
                )}
            </div>

            {/* GPA Section */}
            {hasInvalidGpaSettings ? (
                <div className="gpa-error-section">
                    <h4>⚠️ تحذير: إعدادات المعدل التراكمي غير صحيحة</h4>
                    <p>يرجى التواصل مع المسؤول لإصلاح الإعدادات.</p>
                </div>
            ) : (
                <div className="section-box">
                    <h4 className="section-title">المعدل التراكمي المطلوب للتسجيل في الجدول</h4>
                    <div className="flex-center-gap">
                        <div className="gpa-card">
                            <span className="card-label">من</span>
                            <span className="card-value">{gpaMin}</span>
                        </div>
                        <div className="gpa-card">
                            <span className="card-label">إلى</span>
                            <span className="card-value">{gpaMax}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Level Section */}
            <div className="section-box">
                <h4 className="section-title">المستوى المطلوب للتسجيل في الجدول</h4>
                <div className="gpa-card" style={{ maxWidth: '300px', margin: '0 auto' }}>
                    <span className="card-value" style={{ color: '#4f46e5' }}>{getLevelText(levelCode)}</span>
                </div>
            </div>

            {/* Announcements List */}
            <div className="posts-list">
                <h3>الإعلانات</h3>
                {posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post._id} className="post-card">
                            <h4>{post.title}</h4>
                            <p>{post.content}</p>
                            <small className="post-meta">
                                نشر بواسطة {post.author} في {new Date(post.createdAt).toLocaleDateString('ar-EG')}
                            </small>
                        </div>
                    ))
                ) : (
                    <p className="no-announcements">لا توجد إعلانات حتى الآن</p>
                )}
            </div>
        </div>
    );
};

export default Announcements;