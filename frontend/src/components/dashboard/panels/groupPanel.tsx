import React, { useState, useEffect } from "react";

interface Group {
    _id?: string;
    subject: string;
    number: number;
    type: string;
    day: string;
    from: number;
    to: number;
    capacity: number;
    students?: string[];
}

const GroupPanel: React.FC = () => {

    const [groups, setGroups] = useState<Group[]>([]);
    const [subject, setSubject] = useState("");
    const [number, setNumber] = useState<number | "">("");
    const [type, setType] = useState("");
    const [day, setDay] = useState("");
    const [from, setFrom] = useState<number | "">("");
    const [to, setTo] = useState<number | "">("");
    const [capacity, setCapacity] = useState<number | "">(30);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

    const hours = [
        "8 AM","9 AM","10 AM","11 AM","12 PM",
        "1 PM","2 PM","3 PM","4 PM","5 PM","6 PM","7 PM","8 PM"
    ];

    // Convert time string to number (e.g., "8 AM" -> 8)
    const timeToNumber = (timeStr: string): number => {
        const match = timeStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    };

    // Convert number to time string (e.g., 8 -> "8 AM")
    const numberToTime = (hour: number): string => {
        if (hour === undefined || hour === null) return "";
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${period}`;
    };

    // Format day for display
    const formatDay = (day: string): string => {
        return day.charAt(0).toUpperCase() + day.slice(1);
    };

    // Get display value for selected time
    const getDisplayTime = (timeValue: number | ""): string => {
        if (timeValue === "") return "";
        return numberToTime(Number(timeValue));
    };

    // fetch groups
    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/groups");
            const data = await res.json();
            console.log("API DATA:", data);
            if (Array.isArray(data)) {
                setGroups(data);
            } else {
                setGroups([]);
            }
        } catch (err) {
            console.log(err);
        }
    };

    const validateForm = () => {
        const errors: {[key: string]: string} = {};

        if (!subject) errors.subject = "Subject is required";
        if (!number) errors.number = "Group number is required";
        if (!type) errors.type = "Type is required";
        if (!day) errors.day = "Day is required";
        if (!from) errors.from = "Start time is required";
        if (!to) errors.to = "End time is required";
        if (!capacity) errors.capacity = "Capacity is required";

        if (from && to && Number(from) >= Number(to)) {
            errors.time = "End time must be after start time";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            alert("Please fix the errors before submitting");
            return;
        }

        const groupData = {
            subject: subject.toLowerCase(),
            number: Number(number),
            type: type.toLowerCase(),
            day: day.toLowerCase(),
            from: Number(from),
            to: Number(to),
            capacity: Number(capacity)
        };

        console.log("Submitting:", groupData);

        try {
            let response;
            if (editingId) {
                response = await fetch(`http://localhost:5000/api/groups/${editingId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(groupData)
                });
            } else {
                response = await fetch("http://localhost:5000/api/groups", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(groupData)
                });
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to save group");
            }

            const savedGroup = await response.json();

            if (editingId) {
                setGroups(groups.map(g => g._id === editingId ? savedGroup : g));
                setEditingId(null);
            } else {
                setGroups([...groups, savedGroup]);
            }

            // Reset form
            resetForm();
            alert(`Group ${editingId ? "updated" : "added"} successfully!`);

        } catch (err: any) {
            console.log(err);
            alert(err.message || "Error saving group");
        }
    };

    const resetForm = () => {
        setSubject("");
        setNumber("");
        setType("");
        setDay("");
        setFrom("");
        setTo("");
        setCapacity(30);
        setFormErrors({});
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this group?")) {
            try {
                const response = await fetch(`http://localhost:5000/api/groups/${id}`, {
                    method: "DELETE"
                });

                if (!response.ok) {
                    throw new Error("Failed to delete group");
                }

                setGroups(groups.filter(g => g._id !== id));
                alert("Group deleted successfully!");
            } catch (err) {
                console.log(err);
                alert("Error deleting group");
            }
        }
    };

    const handleEdit = (group: Group) => {
        setEditingId(group._id || null);
        setSubject(group.subject);
        setNumber(group.number);
        setType(group.type);
        setDay(group.day);
        setFrom(group.from);
        setTo(group.to);
        setCapacity(group.capacity);
        setFormErrors({});
    };

    const handleCancel = () => {
        setEditingId(null);
        resetForm();
    };

    // Get badge color based on type
    const getTypeStyle = (type: string) => {
        switch(type.toLowerCase()) {
            case 'lecture':
                return { backgroundColor: "var(--color-info-bg)", color: "var(--color-info)" };
            case 'lab':
                return { backgroundColor: "#f3e5f5", color: "#7b1fa2" };
            case 'tutorial':
                return { backgroundColor: "var(--color-warning-bg)", color: "var(--color-warning)" };
            case 'seminar':
                return { backgroundColor: "var(--color-success-bg)", color: "var(--color-success)" };
            default:
                return { backgroundColor: "var(--color-border)", color: "var(--color-text-muted)" };
        }
    };

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
            <h2 style={{ color: "var(--color-text-secondary)", borderBottom: "2px solid var(--color-success)", paddingBottom: "10px" }}>
                {editingId ? "✏️ Update Group" : "➕ Add New Group"}
            </h2>

            {/* Form Section */}
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                marginBottom: "30px",
                padding: "25px",
                backgroundColor: "var(--color-bg)",
                borderRadius: "10px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
                {/* Selected Values Display */}
                {(subject || number || type || day || from || to) && (
                    <div style={{
                        padding: "15px",
                        backgroundColor: "var(--color-info-bg)",
                        borderRadius: "6px",
                        marginBottom: "10px",
                        border: "1px solid #90caf9"
                    }}>
                        <strong style={{ color: "var(--color-info)" }}>Current Selection:</strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginTop: "8px" }}>
                            {subject && <span><strong>Subject:</strong> {subject.toUpperCase()}</span>}
                            {number && <span><strong>Group:</strong> {number}</span>}
                            {type && <span><strong>Type:</strong> {formatDay(type)}</span>}
                            {day && <span><strong>Day:</strong> {formatDay(day)}</span>}
                            {from && <span><strong>From:</strong> {numberToTime(Number(from))}</span>}
                            {to && <span><strong>To:</strong> {numberToTime(Number(to))}</span>}
                            {capacity && <span><strong>Capacity:</strong> {capacity}</span>}
                        </div>
                    </div>
                )}

                {/* Form Fields */}
                <div style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    alignItems: "flex-start"
                }}>
                    <div style={{ flex: "1", minWidth: "150px" }}>
                        <label style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
                            Subject *
                        </label>
                        <input
                            placeholder="e.g., math101, cs201"
                            value={subject}
                            onChange={(e) => {
                                setSubject(e.target.value);
                                setFormErrors({...formErrors, subject: ""});
                            }}
                            style={{
                                padding: "10px",
                                borderRadius: "6px",
                                border: formErrors.subject ? "2px solid var(--color-error)" : "1px solid var(--color-border)",
                                width: "100%",
                                fontSize: "14px"
                            }}
                        />
                        {formErrors.subject && (
                            <span style={{ color: "var(--color-error)", fontSize: "11px" }}>{formErrors.subject}</span>
                        )}
                    </div>

                    <div style={{ width: "100px" }}>
                        <label style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
                            Group # *
                        </label>
                        <input
                            type="number"
                            placeholder="Number"
                            value={number}
                            onChange={(e) => {
                                setNumber(Number(e.target.value));
                                setFormErrors({...formErrors, number: ""});
                            }}
                            style={{
                                padding: "10px",
                                borderRadius: "6px",
                                border: formErrors.number ? "2px solid var(--color-error)" : "1px solid var(--color-border)",
                                width: "100%",
                                fontSize: "14px"
                            }}
                        />
                    </div>

                    <div style={{ width: "120px" }}>
                        <label style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
                            Type *
                        </label>
                        <select
                            value={type}
                            onChange={(e) => {
                                setType(e.target.value);
                                setFormErrors({...formErrors, type: ""});
                            }}
                            style={{
                                padding: "10px",
                                borderRadius: "6px",
                                border: formErrors.type ? "2px solid var(--color-error)" : "1px solid var(--color-border)",
                                width: "100%",
                                fontSize: "14px",
                                backgroundColor: "white"
                            }}
                        >
                            <option value="">Select</option>
                            <option value="lecture">📚 Lecture</option>
                            <option value="lab">🔬 Lab</option>
                            <option value="tutorial">📝 Tutorial</option>
                            <option value="seminar">🎤 Seminar</option>
                        </select>
                    </div>

                    <div style={{ width: "120px" }}>
                        <label style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
                            Day *
                        </label>
                        <select
                            value={day}
                            onChange={(e) => {
                                setDay(e.target.value);
                                setFormErrors({...formErrors, day: ""});
                            }}
                            style={{
                                padding: "10px",
                                borderRadius: "6px",
                                border: formErrors.day ? "2px solid var(--color-error)" : "1px solid var(--color-border)",
                                width: "100%",
                                fontSize: "14px",
                                backgroundColor: "white"
                            }}
                        >
                            <option value="">Select</option>
                            <option value="monday">Monday</option>
                            <option value="tuesday">Tuesday</option>
                            <option value="wednesday">Wednesday</option>
                            <option value="thursday">Thursday</option>
                            <option value="friday">Friday</option>
                            <option value="saturday">Saturday</option>
                            <option value="sunday">Sunday</option>
                        </select>
                    </div>

                    <div style={{ width: "100px" }}>
                        <label style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
                            From *
                        </label>
                        <select
                            value={from}
                            onChange={(e) => {
                                setFrom(Number(e.target.value));
                                setFormErrors({...formErrors, from: "", time: ""});
                            }}
                            style={{
                                padding: "10px",
                                borderRadius: "6px",
                                border: formErrors.from || formErrors.time ? "2px solid var(--color-error)" : "1px solid var(--color-border)",
                                width: "100%",
                                fontSize: "14px",
                                backgroundColor: "white"
                            }}
                        >
                            <option value="">Select</option>
                            {hours.map(h => (
                                <option key={h} value={timeToNumber(h)}>{h}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ width: "100px" }}>
                        <label style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
                            To *
                        </label>
                        <select
                            value={to}
                            onChange={(e) => {
                                setTo(Number(e.target.value));
                                setFormErrors({...formErrors, to: "", time: ""});
                            }}
                            style={{
                                padding: "10px",
                                borderRadius: "6px",
                                border: formErrors.to || formErrors.time ? "2px solid var(--color-error)" : "1px solid var(--color-border)",
                                width: "100%",
                                fontSize: "14px",
                                backgroundColor: "white"
                            }}
                        >
                            <option value="">Select</option>
                            {hours.map(h => (
                                <option key={h} value={timeToNumber(h)}>{h}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ width: "90px" }}>
                        <label style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>
                            Capacity *
                        </label>
                        <input
                            type="number"
                            placeholder="30"
                            value={capacity}
                            onChange={(e) => {
                                setCapacity(Number(e.target.value));
                                setFormErrors({...formErrors, capacity: ""});
                            }}
                            min="1"
                            style={{
                                padding: "10px",
                                borderRadius: "6px",
                                border: formErrors.capacity ? "2px solid var(--color-error)" : "1px solid var(--color-border)",
                                width: "100%",
                                fontSize: "14px"
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", marginTop: "18px" }}>
                        <button
                            onClick={handleSubmit}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: editingId ? "var(--color-info)" : "var(--color-success)",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "bold",
                                fontSize: "14px",
                                transition: "opacity 0.3s",
                                opacity: 0.9
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
                        >
                            {editingId ? "✏️ Update Group" : "➕ Add Group"}
                        </button>

                        {editingId && (
                            <button
                                onClick={handleCancel}
                                style={{
                                    padding: "10px 20px",
                                    backgroundColor: "var(--color-error)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    fontSize: "14px"
                                }}
                            >
                                ✕ Cancel
                            </button>
                        )}
                    </div>
                </div>

                {formErrors.time && (
                    <div style={{
                        color: "var(--color-error)",
                        fontSize: "13px",
                        marginTop: "5px",
                        padding: "8px",
                        backgroundColor: "var(--color-error-bg)",
                        borderRadius: "4px"
                    }}>
                        ⚠️ {formErrors.time}
                    </div>
                )}
            </div>

            {/* Groups Dashboard */}
            <h2 style={{ color: "var(--color-text-secondary)", borderBottom: "2px solid var(--color-success)", paddingBottom: "10px" }}>
                📊 Groups Dashboard ({groups.length})
            </h2>

            {groups.length === 0 ? (
                <div style={{
                    textAlign: "center",
                    padding: "60px",
                    backgroundColor: "var(--color-bg)",
                    borderRadius: "8px",
                    color: "var(--color-text-muted)",
                    fontSize: "16px"
                }}>
                    📭 No groups found. Add your first group above!
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        borderRadius: "8px",
                        overflow: "hidden"
                    }}>
                        <thead>
                        <tr style={{ backgroundColor: "var(--color-success)", color: "white" }}>
                            <th style={{ padding: "14px", textAlign: "left" }}>Subject</th>
                            <th style={{ padding: "14px", textAlign: "left" }}>Group #</th>
                            <th style={{ padding: "14px", textAlign: "left" }}>Type</th>
                            <th style={{ padding: "14px", textAlign: "left" }}>Day</th>
                            <th style={{ padding: "14px", textAlign: "left" }}>From</th>
                            <th style={{ padding: "14px", textAlign: "left" }}>To</th>
                            <th style={{ padding: "14px", textAlign: "left" }}>Capacity</th>
                            <th style={{ padding: "14px", textAlign: "left" }}>Students</th>
                            <th style={{ padding: "14px", textAlign: "left" }}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {groups.map((group, index) => (
                            <tr
                                key={group._id}
                                style={{
                                    backgroundColor: index % 2 === 0 ? "var(--color-bg)" : "white",
                                    borderBottom: "1px solid var(--color-border)",
                                    transition: "background-color 0.3s"
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f8e9")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? "var(--color-bg)" : "white")}
                            >
                                <td style={{ padding: "14px", fontWeight: "bold" }}>
                                    {group.subject.toUpperCase()}
                                </td>
                                <td style={{ padding: "14px" }}>{group.number}</td>
                                <td style={{ padding: "14px" }}>
                                        <span style={{
                                            padding: "6px 12px",
                                            borderRadius: "20px",
                                            fontSize: "13px",
                                            fontWeight: "500",
                                            display: "inline-block",
                                            ...getTypeStyle(group.type)
                                        }}>
                                            {group.type.charAt(0).toUpperCase() + group.type.slice(1)}
                                        </span>
                                </td>
                                <td style={{ padding: "14px" }}>{formatDay(group.day)}</td>
                                <td style={{ padding: "14px", fontWeight: "500" }}>{numberToTime(group.from)}</td>
                                <td style={{ padding: "14px", fontWeight: "500" }}>{numberToTime(group.to)}</td>
                                <td style={{ padding: "14px" }}>
                                        <span style={{
                                            backgroundColor: "var(--color-success-bg)",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            color: "var(--color-success)",
                                            fontWeight: "500"
                                        }}>
                                            {group.capacity}
                                        </span>
                                </td>
                                <td style={{ padding: "14px" }}>
                                        <span style={{
                                            backgroundColor: "var(--color-warning-bg)",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            color: "var(--color-warning)",
                                            fontWeight: "500"
                                        }}>
                                            {group.students?.length || 0}
                                        </span>
                                </td>
                                <td style={{ padding: "14px" }}>
                                    <button
                                        onClick={() => handleEdit(group)}
                                        style={{
                                            padding: "6px 12px",
                                            marginRight: "6px",
                                            backgroundColor: "var(--color-info)",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "13px",
                                            transition: "opacity 0.3s",
                                            opacity: 0.9
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(group._id!)}
                                        style={{
                                            padding: "6px 12px",
                                            backgroundColor: "var(--color-error)",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "13px",
                                            transition: "opacity 0.3s",
                                            opacity: 0.9
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
                                    >
                                        🗑️ Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default GroupPanel;
        

  
        
          

  
         
       

         

             

               
            
        