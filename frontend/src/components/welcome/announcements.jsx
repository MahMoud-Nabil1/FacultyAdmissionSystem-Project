import React, { useEffect, useState } from 'react';
import './css/announcements.css'; // تم تغيير المسار

const API_URL = 'http://localhost:5000/api';

const Announcements = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [gpaMin, setGpaMin] = useState(2.5);
    const [gpaMax, setGpaMax] = useState(5);
    const [level, setLevel] = useState('1');
    const [posts, setPosts] = useState([]);
    const [logoError, setLogoError] = useState(false);
    const [gpaError, setGpaError] = useState('');

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
                throw new Error('فشل في تحميل البيانات');
            }

            const announcements = await announcementsRes.json();
            const settings = await settingsRes.json();

            setPosts(announcements);

            const min = Math.min(settings.gpaMin, settings.gpaMax);
            const max = Math.max(settings.gpaMin, settings.gpaMax);

            setGpaMin(min);
            setGpaMax(max);

            if (settings.gpaMin >= settings.gpaMax) {
                setGpaError('⚠️ تحذير: الإعدادات غير صحيحة (الحد الأدنى أكبر من الحد الأقصى)');
            } else {
                setGpaError('');
            }

            const levelMap = {
                '1': 'المستوى الأول',
                '2': 'المستوى الثاني',
                '3': 'المستوى الثالث',
                '4': 'المستوى الرابع'
            };
            const levels = Array.isArray(settings.level) ? settings.level : (settings.level ? [settings.level] : ['1']);
            setLevel(levels.map(l => levelMap[String(l)] || l).join('، ') || 'المستوى الأول');

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
        return <div className="loading-container">جاري التحميل...</div>;
    }

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
                    {!user ? (
                        <button
                            className="login-btn"
                            onClick={() => window.location.href = '/login'}
                        >
                            تسجيل الدخول
                        </button>
                    ) : (
                        <span className="user-welcome">
                            مرحباً, {user.name} ({user.role === 'admin' ? 'مدير' : 'طالب'})
                        </span>
                    )}
                </div>
            </div>

            {/* GPA Section */}
            {gpaError ? (
                <div className="gpa-error-section">
                    <h4 className="gpa-error-title">⚠️ {gpaError}</h4>
                    <p className="gpa-error-text">يرجى التواصل مع المسؤول لإصلاح الإعدادات.</p>
                </div>
            ) : (
                <div className="section-box">
                    <h4 className="section-title">
                        المعدل التراكمي المطلوب للتسجيل في الجدول
                    </h4>
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
                    <span className="card-value" style={{ color: 'var(--primary)' }}>{level}</span>
                </div>
            </div>

            {/* Announcements List */}
            <div className="posts-list">
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>الإعلانات</h3>
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
                    <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                        لا توجد إعلانات حتى الآن
                    </p>
                )}
            </div>
        </div>
    );
};

export default Announcements;