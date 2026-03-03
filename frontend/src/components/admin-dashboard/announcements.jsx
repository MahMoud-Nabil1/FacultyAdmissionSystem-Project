import React, { useEffect, useState } from 'react';
import './css/announcements.css';

const Announcements = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [gpaRange, setGpaRange] = useState({ min: 2.5, max: 5 });
    const [selectedLevel, setSelectedLevel] = useState('level 1');
    const [posts, setPosts] = useState([]);
    const [logoError, setLogoError] = useState(false);
    const [gpaError, setGpaError] = useState('');

    useEffect(() => {
        // جلب بيانات المستخدم
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
            } catch {
                setUser(userData);
            }
        }

        // جلب الإعلانات
        const savedPosts = localStorage.getItem('announcements');
        if (savedPosts) {
            setPosts(JSON.parse(savedPosts));
        }

        // جلب إعدادات GPA
        const savedGpa = localStorage.getItem('gpaSettings');
        if (savedGpa) {
            const parsedGpa = JSON.parse(savedGpa);
            setGpaRange(parsedGpa);

            // Check if max <= min
            if (parsedGpa.max <= parsedGpa.min) {
                setGpaError(`Invalid GPA Settings: Max (${parsedGpa.max}) must be greater than Min (${parsedGpa.min})`);
            }
        }

        // جلب الـ Level
        const savedLevel = localStorage.getItem('selectedLevel');
        if (savedLevel) {
            setSelectedLevel(savedLevel);
        }

        setLoading(false);
    }, []);

    const isAdmin = user?.role === 'admin';

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {/* Header with Logo and Login */}
            <div className="announcements-header">
                <div>
                    {!logoError && (
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="announcements-logo"
                            onError={() => setLogoError(true)}
                        />
                    )}
                </div>
                <div>
                    {!user ? (
                        <button onClick={() => window.location.href = '/login'}>
                            Login
                        </button>
                    ) : (
                        <span>Welcome, {user.name} ({user.role || 'Student'})</span>
                    )}
                </div>
            </div>

            {/* Admin Post Area - Only visible to admin */}
            {isAdmin && (
                <div className="announcement-form">
                    <h3>Create Announcement</h3>
                    <input
                        type="text"
                        placeholder="Title"
                        className="announcement-input"
                    />
                    <br />
                    <textarea
                        placeholder="Content"
                        rows="4"
                        className="announcement-textarea"
                    />
                    <br />
                    <button>Post Announcement</button>
                </div>
            )}

            {/* GPA Range Display - Hidden if invalid, show error message instead */}
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
                        ⚠️ GPA Configuration Error
                    </h4>
                    <p style={{ color: '#b71c1c', fontSize: '16px', margin: '0' }}>
                        {gpaError}
                    </p>
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
                        Please contact the administrator to fix the GPA settings.
                    </p>
                </div>
            ) : (
                <div className="gpa-range-section">
                    <h4>GPA that allowed to sign the schedule</h4>
                    <div>
                        <span>Min GPA: {gpaRange.min}</span>
                    </div>
                    <div className="gpa-row">
                        <span>Max GPA: {gpaRange.max}</span>
                    </div>
                </div>
            )}

            {/* Level Display */}
            <div className="level-section">
                <h4>Level to Sign Schedule</h4>
                <span>{selectedLevel || 'Not selected'}</span>
            </div>

            {/* Announcements List */}
            <div className="announcements-list">
                <h3>Announcements</h3>
                {posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post.id} className="announcement-item">
                            <h4>{post.title}</h4>
                            <p>{post.content}</p>
                            <small>
                                Posted by {post.author} on {new Date(post.createdAt).toLocaleDateString()}
                            </small>
                            <hr />
                        </div>
                    ))
                ) : (
                    <p>No announcements yet.</p>
                )}
            </div>
        </div>
    );
};

export default Announcements;