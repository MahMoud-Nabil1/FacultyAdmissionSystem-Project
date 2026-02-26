import React, {useEffect, useState} from 'react';

const Announcements = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [gpaRange, setGpaRange] = useState({min: 2.5, max: 5});
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
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px'}}>
                <div>
                    {!logoError && (
                        <img
                            src="/logo.png"
                            alt="Logo"
                            style={{height: '50px'}}
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
                <div style={{border: '1px solid #ccc', padding: '15px', margin: '10px 0'}}>
                    <h3>Create Announcement</h3>
                    <input
                        type="text"
                        placeholder="Title"
                        style={{width: '100%', marginBottom: '10px', padding: '5px'}}
                    />
                    <br/>
                    <textarea
                        placeholder="Content"
                        rows="4"
                        style={{width: '100%', marginBottom: '10px', padding: '5px'}}
                    />
                    <br/>
                    <button>Post Announcement</button>
                </div>
            )}

            {/* GPA Range Filter - Numbers only, admin only can change */}
            <div style={{margin: '20px 0', padding: '10px', border: '1px solid #eee'}}>
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
                            onChange={(e) => setGpaRange({...gpaRange, min: parseFloat(e.target.value)})}
                            style={{width: '60px', margin: '0 10px'}}
                        />
                    ) : (
                        <span>{gpaRange.min}</span>
                    )}
                </div>
                <div style={{marginTop: '10px'}}>
                    <span>Max GPA: </span>
                    {isAdmin ? (
                        <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.1"
                            value={gpaRange.max}
                            onChange={(e) => setGpaRange({...gpaRange, max: parseFloat(e.target.value)})}
                            style={{width: '60px', margin: '0 10px'}}
                        />
                    ) : (
                        <span>{gpaRange.max}</span>
                    )}
                </div>
            </div>


            <div style={{margin: '20px 0', padding: '10px', border: '1px solid #eee'}}>
                <h4>Level to Sign Schedule</h4>
                {isAdmin ? (
                    <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        style={{padding: '5px', width: '200px'}}
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
                    <button style={{marginLeft: '10px'}}>
                        Sign Schedule
                    </button>
                )}
            </div>

            <div style={{marginTop: '30px'}}>
                <h3>Announcements</h3>
                <p>No announcements yet.</p>
            </div>
        </div>
    );
};

export default Announcements;