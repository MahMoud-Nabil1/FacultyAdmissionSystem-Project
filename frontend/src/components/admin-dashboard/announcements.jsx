import React, { useEffect, useState } from 'react';
import './css/announcements.css';

const Announcements = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [gpaRange, setGpaRange] = useState({ min: 2.5, max: 5 });
    const [selectedLevel, setSelectedLevel] = useState('المستوى الأول');
    const [posts, setPosts] = useState([]);
    const [logoError, setLogoError] = useState(false);
    const [gpaError, setGpaError] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
            } catch {
                setUser(userData);
            }
        }

        const savedPosts = localStorage.getItem('announcements');
        if (savedPosts) {
            setPosts(JSON.parse(savedPosts));
        }

        const savedGpa = localStorage.getItem('gpaSettings');
        if (savedGpa) {
            const parsedGpa = JSON.parse(savedGpa);
            setGpaRange(parsedGpa);

            if (parsedGpa.max <= parsedGpa.min) {
                setGpaError(`خطأ في إعدادات المعدل التراكمي: الحد الأقصى (${parsedGpa.max}) يجب أن يكون أكبر من الحد الأدنى (${parsedGpa.min})`);
            }
        }

        const savedLevel = localStorage.getItem('selectedLevel');
        if (savedLevel) {
            let levelText = 'المستوى الأول';
            if (savedLevel === '1') levelText = 'المستوى الأول';
            else if (savedLevel === '2') levelText = 'المستوى الثاني';
            else if (savedLevel === '3') levelText = 'المستوى الثالث';
            else if (savedLevel === '4') levelText = 'المستوى الرابع';
            setSelectedLevel(levelText);
        }

        setLoading(false);
    }, []);

    const isAdmin = user?.role === 'admin';

    if (loading) {
        return <div>جاري التحميل...</div>;
    }

    return (
        <div dir="rtl">
            {/* Header with Logo and Login */}
            <div className="announcements-header">
                <div>
                    {!logoError && (
                        <img
                            src="/logo.png"
                            alt="الشعار"
                            className="announcements-logo"
                            onError={() => setLogoError(true)}
                        />
                    )}
                </div>
                <div>
                    {!user ? (
                        <button onClick={() => window.location.href = '/login'}>
                            تسجيل الدخول
                        </button>
                    ) : (
                        <span>مرحباً, {user.name} ({user.role === 'admin' ? 'مدير' : 'طالب'})</span>
                    )}
                </div>
            </div>

            {/* Admin Post Area - Only visible to admin */}
            {isAdmin && (
                <div className="announcement-form">
                    <h3>إنشاء إعلان جديد</h3>
                    <input
                        type="text"
                        placeholder="العنوان"
                        className="announcement-input"
                    />
                    <br />
                    <textarea
                        placeholder="المحتوى"
                        rows="4"
                        className="announcement-textarea"
                    />
                    <br />
                    <button>نشر الإعلان</button>
                </div>
            )}

            {/* GPA Range Display - في صندوقين منفصلين */}
            {gpaError ? (
                <div className="gpa-error-section" style={{
                    backgroundColor: '#ffebee',
                    border: '1px solid #ef5350',
                    borderRadius: '4px',
                    padding: '15px',
                    margin: '20px 0',
                    textAlign: 'center'
                }}>
                    <h4 style={{ color: '#c62828', margin: '0 0 10px 0' }}>
                        ⚠️ خطأ في إعدادات المعدل التراكمي
                    </h4>
                    <p style={{ color: '#b71c1c', fontSize: '16px', margin: '0' }}>
                        {gpaError}
                    </p>
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                        يرجى التواصل مع المسؤول لإصلاح إعدادات المعدل التراكمي.
                    </p>
                </div>
            ) : (
                <div className="gpa-range-section" style={{
                    backgroundColor: '#f5f5f5',
                    padding: '20px',
                    borderRadius: '8px',
                    margin: '20px 0'
                }}>
                    <h4 style={{ marginBottom: '15px', textAlign: 'center' }}>المعدل التراكمي المطلوب للتسجيل في الجدول</h4>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '30px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{
                            backgroundColor: '#fff',
                            padding: '20px 40px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            textAlign: 'center',
                            border: '2px solid #2196F3'
                        }}>
                            <span style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '5px' }}>
                                من
                            </span>
                            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196F3' }}>
                                {gpaRange.min}
                            </span>
                        </div>
                        <div style={{
                            backgroundColor: '#fff',
                            padding: '20px 40px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            textAlign: 'center',
                            border: '2px solid #4CAF50'
                        }}>
                            <span style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '5px' }}>
                                إلى
                            </span>
                            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#4CAF50' }}>
                                {gpaRange.max}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Level Display - في صندوق */}
            <div className="level-section" style={{
                backgroundColor: '#f5f5f5',
                padding: '20px',
                borderRadius: '8px',
                margin: '20px 0',
                textAlign: 'center'
            }}>
                <h4 style={{ marginBottom: '15px' }}>المستوى المطلوب للتسجيل في الجدول</h4>
                <div style={{
                    backgroundColor: '#fff',
                    padding: '20px 40px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: 'inline-block',
                    border: '2px solid #FF9800'
                }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                        {selectedLevel || 'غير محدد'}
                    </span>
                </div>
            </div>

            {/* Announcements List */}
            <div className="announcements-list" style={{ marginTop: '30px' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>الإعلانات</h3>
                {posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post.id} className="announcement-item" style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            marginBottom: '15px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <h4 style={{ color: '#333', marginBottom: '10px' }}>{post.title}</h4>
                            <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '10px' }}>{post.content}</p>
                            <small style={{ color: '#999' }}>
                                نشر بواسطة {post.author} في {new Date(post.createdAt).toLocaleDateString('ar-EG')}
                            </small>
                            <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #eee' }} />
                        </div>
                    ))
                ) : (
                    <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                        لا توجد إعلانات حتى الآن
                    </p>
                )}
            </div>
        </div>
    );
};

export default Announcements;