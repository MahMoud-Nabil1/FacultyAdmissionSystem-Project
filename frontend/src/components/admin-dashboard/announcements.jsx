import React, { useEffect, useState } from 'react';
import './css/announcements.css';

const Announcements = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [gpaRange, setGpaRange] = useState({ min: 2.5, max: 5 });
    const [selectedLevel, setSelectedLevel] = useState('level 1');
    const [logoError, setLogoError] = useState(false);

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
        setLoading(false);
    }, []);

    const isAdmin = user?.role === 'admin';

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {/* Logo and Login in same row */}
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

            {/* GPA Range Filter - Numbers only, admin only can change */}
            <div className="gpa-range-section">
                <h4>GPA that allowed to sign the schedule</h4>
                <div>
                    <span>Min GPA: </span>
                    {isAdmin ? (
                        <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={gpaRange.min}
                            onChange={(e) => setGpaRange({ ...gpaRange, min: parseFloat(e.target.value) })}
                            className="gpa-input"
                        />
                    ) : (
                        <span>{gpaRange.min}</span>
                    )}
                </div>
                <div className="gpa-row">
                    <span>Max GPA: </span>
                    {isAdmin ? (
                        <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={gpaRange.max}
                            onChange={(e) => setGpaRange({ ...gpaRange, max: parseFloat(e.target.value) })}
                            className="gpa-input"
                        />
                    ) : (
                        <span>{gpaRange.max}</span>
                    )}
                </div>
            </div>


            <div className="level-section">
                <h4>Level to Sign Schedule</h4>
                {isAdmin ? (
                    <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="level-select"
                    >
                        <option value="">Choose Level</option>
                        <option value="1">Level 1</option>
                        <option value="2">Level 2</option>
                        <option value="3">Level 3</option>
                        <option value="4">Level 4</option>
                    </select>
                ) : (
                    <span>{selectedLevel || 'Not selected'}</span>
                )}
                {selectedLevel && isAdmin && (
                    <button className="sign-btn">
                        Sign Schedule
                    </button>
                )}
            </div>

            <div className="announcements-list">
                <h3>Announcements</h3>
                <p>No announcements yet.</p>
            </div>
        </div>
    );
};

export default Announcements;