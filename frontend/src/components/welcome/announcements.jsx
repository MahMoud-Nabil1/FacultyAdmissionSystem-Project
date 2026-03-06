import React, { useEffect, useState } from 'react';

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
            setLevel(levelMap[settings.level] || 'المستوى الأول');

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
        return (
            <div style={{
                textAlign: 'center',
                padding: '50px',
                fontFamily: 'Arial, sans-serif',
                fontSize: '18px',
                color: '#666'
            }}>
                جاري التحميل...
            </div>
        );
    }

    return (
        <div dir="rtl" style={{
            fontFamily: 'Arial, sans-serif',
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 20px',
                backgroundColor: '#f8f9fa',
                borderBottom: '2px solid #e9ecef',
                borderRadius: '8px 8px 0 0',
                marginBottom: '20px'
            }}>
                <div>
                    {!logoError && (
                        <img
                            src="/logo.png"
                            alt="الشعار"
                            style={{ height: '60px', width: 'auto' }}
                            onError={() => setLogoError(true)}
                        />
                    )}
                </div>
                <div>
                    {!user ? (
                        <button
                            onClick={() => window.location.href = '/login'}
                            style={{
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            تسجيل الدخول
                        </button>
                    ) : (
                        <span style={{
                            fontSize: '18px',
                            fontWeight: '500',
                            color: '#343a40'
                        }}>
                            مرحباً, {user.name} ({user.role === 'admin' ? 'مدير' : 'طالب'})
                        </span>
                    )}
                </div>
            </div>

            {/* GPA Section */}
            {gpaError ? (
                <div style={{
                    backgroundColor: '#ffebee',
                    border: '1px solid #ef5350',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    <h4 style={{ color: '#c62828', margin: '0 0 10px 0' }}>⚠️ {gpaError}</h4>
                    <p style={{ color: '#666' }}>يرجى التواصل مع المسؤول لإصلاح الإعدادات.</p>
                </div>
            ) : (
                <div style={{
                    backgroundColor: '#f5f5f5',
                    padding: '20px',
                    marginBottom: '20px',
                    borderRadius: '8px'
                }}>
                    <h4 style={{ margin: '0 0 20px 0', textAlign: 'center', color: '#333' }}>
                        المعدل التراكمي المطلوب للتسجيل في الجدول
                    </h4>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '30px',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px 40px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            textAlign: 'center',
                            minWidth: '120px',
                            border: '2px solid #2196F3'
                        }}>
                            <span style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '5px' }}>من</span>
                            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196F3' }}>{gpaMin}</span>
                        </div>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '20px 40px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            textAlign: 'center',
                            minWidth: '120px',
                            border: '2px solid #4CAF50'
                        }}>
                            <span style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '5px' }}>إلى</span>
                            <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#4CAF50' }}>{gpaMax}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Level Section */}
            <div style={{
                backgroundColor: '#f5f5f5',
                padding: '20px',
                marginBottom: '20px',
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>المستوى المطلوب للتسجيل في الجدول</h4>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px 40px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: 'inline-block',
                    border: '2px solid #FF9800'
                }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                        {level}
                    </span>
                </div>
            </div>

            {/* Announcements List */}
            <div style={{ marginTop: '30px' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>الإعلانات</h3>
                {posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post._id} style={{
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