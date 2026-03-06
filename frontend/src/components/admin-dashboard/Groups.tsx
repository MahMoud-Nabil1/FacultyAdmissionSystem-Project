import React, { useEffect, useState } from "react";

interface Group {
    _id: string;
    number: number;
    subject: string;
    type: string;
    from: number;
    to: number;
    day: string;
    capacity: number;
}

const Groups: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filterDay, setFilterDay] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");

    // API URL
    const API_URL = 'http://localhost:5000';

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Fetching groups from:', `${API_URL}/api/groups`);

            const res = await fetch(`${API_URL}/api/groups`);

            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('API endpoint not found. Make sure your server is running on port 5000');
                } else {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
            }

            const data: Group[] = await res.json();
            console.log("Groups fetched:", data);
            setGroups(data);
        } catch (err) {
            console.error("Failed to fetch groups:", err);
            if (err instanceof Error) {
                if (err.message.includes('Failed to fetch')) {
                    setError('Cannot connect to the backend server. Please make sure it\'s running on http://localhost:5000');
                } else {
                    setError(err.message);
                }
            } else {
                setError('Failed to fetch groups');
            }
        } finally {
            setLoading(false);
        }
    };

    // Format subject for display
    const formatSubject = (subject: string) => {
        const match = subject.match(/([a-zA-Z]+)(\d+)/);
        if (match) {
            const prefix = match[1].toUpperCase();
            const number = match[2];
            return `${prefix} ${number}`;
        }
        return subject.toUpperCase();
    };

    // Filter groups by day AND search term
    const filteredGroups = groups.filter(group => {
        // First filter by day
        const dayMatch = filterDay === "all" || group.day.toLowerCase() === filterDay.toLowerCase();

        // Then filter by search term (subject name)
        const formattedSubject = formatSubject(group.subject).toLowerCase();
        const searchMatch = searchTerm === "" ||
            formattedSubject.includes(searchTerm.toLowerCase()) ||
            group.subject.toLowerCase().includes(searchTerm.toLowerCase());

        return dayMatch && searchMatch;
    });

    // Day options for filter
    const days = ["all", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

    // Styles
    const styles = {
        container: {
            padding: "20px",
            fontFamily: "Arial, sans-serif",
            maxWidth: "1200px",
            margin: "0 auto",
        },
        title: {
            textAlign: "center" as const,
            marginTop: "20px",
            fontSize: "28px",
            color: "#333",
        },
        controlsContainer: {
            margin: "20px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap" as const,
        },
        searchBox: {
            flex: "1",
            minWidth: "250px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
        },
        searchInput: {
            flex: "1",
            padding: "10px 12px",
            fontSize: "14px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            outline: "none",
            transition: "border 0.3s",
        },
        filterGroup: {
            display: "flex",
            alignItems: "center",
            gap: "10px",
        },
        select: {
            padding: "10px 12px",
            fontSize: "14px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            outline: "none",
            cursor: "pointer",
        },
        clearButton: {
            padding: "10px 12px",
            fontSize: "14px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginLeft: "8px",
        },
        table: {
            width: "100%",
            borderCollapse: "collapse" as const,
            marginTop: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
        th: {
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "12px 15px",
            textAlign: "left" as const,
            fontSize: "14px",
            fontWeight: "600",
        },
        td: {
            padding: "12px 15px",
            borderBottom: "1px solid #ddd",
            fontSize: "14px",
        },
        trEven: {
            backgroundColor: "#f9f9f9",
        },
        badge: {
            display: "inline-block",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "500",
        },
        typeLecture: {
            backgroundColor: "#e3f2fd",
            color: "#1976d2",
        },
        typeLab: {
            backgroundColor: "#f3e5f5",
            color: "#7b1fa2",
        },
        typeTutorial: {
            backgroundColor: "#fff3e0",
            color: "#f57c00",
        },
        loading: {
            textAlign: "center" as const,
            padding: "40px",
            fontSize: "18px",
            color: "#666",
        },
        error: {
            textAlign: "center" as const,
            padding: "20px",
            fontSize: "16px",
            color: "#d32f2f",
            backgroundColor: "#ffebee",
            borderRadius: "4px",
            marginTop: "20px",
        },
        emptyState: {
            textAlign: "center" as const,
            padding: "60px 20px",
            fontSize: "18px",
            color: "#666",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            marginTop: "30px",
            border: "1px dashed #ccc",
        },
        adminMessage: {
            marginTop: "15px",
            padding: "15px",
            backgroundColor: "#e8f4fd",
            borderRadius: "6px",
            color: "#0288d1",
            fontSize: "16px",
        },
        adminEmail: {
            fontWeight: "bold" as const,
            color: "#01579b",
        },
        timeSlot: {
            fontWeight: "bold" as const,
            color: "#333",
        },
        subjectCell: {
            fontWeight: "bold" as const,
            color: "#2c3e50",
            textTransform: "uppercase" as const,
        },
        resultCount: {
            marginBottom: "10px",
            color: "#666",
            fontSize: "14px",
        },
    };

    const getTypeStyle = (type: string) => {
        const baseStyle = styles.badge;
        switch(type.toLowerCase()) {
            case "lecture":
                return { ...baseStyle, ...styles.typeLecture };
            case "lab":
                return { ...baseStyle, ...styles.typeLab };
            case "tutorial":
                return { ...baseStyle, ...styles.typeTutorial };
            default:
                return { ...baseStyle, backgroundColor: "#e0e0e0", color: "#616161" };
        }
    };

    const formatTime = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
    };

    const getDayDisplay = (day: string) => {
        return day.charAt(0).toUpperCase() + day.slice(1);
    };

    const clearSearch = () => {
        setSearchTerm("");
    };

    if (loading) {
        return <div style={styles.loading}>Loading groups...</div>;
    }

    if (error) {
        return (
            <div style={styles.container}>
                <h1 style={styles.title}>Groups Schedule</h1>
                <div style={styles.error}>
                    <strong>Error:</strong> {error}
                    <button
                        onClick={fetchGroups}
                        style={{
                            display: "block",
                            margin: "20px auto 0",
                            padding: "8px 16px",
                            backgroundColor: "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Groups Schedule</h1>

            <div style={styles.controlsContainer}>
                {/* Search Box */}
                <div style={styles.searchBox}>
                    <label htmlFor="search">🔍 Search:</label>
                    <input
                        id="search"
                        type="text"
                        placeholder="Search by subject (e.g., MATH, CS, PHYS)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                    {searchTerm && (
                        <button
                            style={styles.clearButton}
                            onClick={clearSearch}
                        >
                            ✕ Clear
                        </button>
                    )}
                </div>

                {/* Day Filter */}
                <div style={styles.filterGroup}>
                    <label htmlFor="day-filter">Filter by day:</label>
                    <select
                        id="day-filter"
                        style={styles.select}
                        value={filterDay}
                        onChange={(e) => setFilterDay(e.target.value)}
                    >
                        {days.map(day => (
                            <option key={day} value={day}>
                                {day === "all" ? "All Days" : getDayDisplay(day)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {groups.length === 0 ? (
                <div style={styles.emptyState}>
                    <p>📚 No groups found</p>
                    <div style={styles.adminMessage}>
                        <span style={styles.adminEmail}>📧 Please contact admin: admin@admin.com</span>
                    </div>
                </div>
            ) : (
                <>
                    <div style={styles.resultCount}>
                        Showing {filteredGroups.length} of {groups.length} groups
                        {searchTerm && ` • Search: "${searchTerm}"`}
                        {filterDay !== "all" && ` • Day: ${getDayDisplay(filterDay)}`}
                    </div>

                    {filteredGroups.length === 0 ? (
                        <div style={styles.emptyState}>
                            <p>No groups match your search criteria</p>
                            <div style={styles.adminMessage}>
                                <span style={styles.adminEmail}>📧 Please contact admin: admin@admin.com</span>
                            </div>
                            <button
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterDay("all");
                                }}
                                style={{
                                    marginTop: "15px",
                                    padding: "8px 16px",
                                    backgroundColor: "#4CAF50",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer"
                                }}
                            >
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                            <tr>
                                <th style={styles.th}>Subject</th>
                                <th style={styles.th}>Group</th>
                                <th style={styles.th}>Type</th>
                                <th style={styles.th}>Day</th>
                                <th style={styles.th}>Time</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredGroups.map((group, index) => (
                                <tr
                                    key={group._id}
                                    style={index % 2 === 0 ? styles.trEven : undefined}
                                >
                                    <td style={{...styles.td, ...styles.subjectCell}}>
                                        {formatSubject(group.subject)}
                                    </td>
                                    <td style={styles.td}>
                                        <strong>Group {group.number}</strong>
                                    </td>
                                    <td style={styles.td}>
                                            <span style={getTypeStyle(group.type)}>
                                                {group.type}
                                            </span>
                                    </td>
                                    <td style={styles.td}>
                                        {getDayDisplay(group.day)}
                                    </td>
                                    <td style={styles.td}>
                                            <span style={styles.timeSlot}>
                                                {formatTime(group.from)} - {formatTime(group.to)}
                                            </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}
        </div>
    );
};

export default Groups;
