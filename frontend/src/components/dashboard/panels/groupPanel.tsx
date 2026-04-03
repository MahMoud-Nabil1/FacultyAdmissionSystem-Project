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

    // --- Subjects state management ---
    const [subjects, setSubjects] = useState<Array<{_id: string, code: string, name: string}>>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [subjectsError, setSubjectsError] = useState<string | null>(null);

    // --- Lecture (main group) fields ---
    const [subject, setSubject] = useState("");
    const [number, setNumber] = useState<number | "">("");
    const [type, setType] = useState("lecture");
    const [day, setDay] = useState("");
    const [from, setFrom] = useState<number | "">("");
    const [to, setTo] = useState<number | "">("");
    const [capacity, setCapacity] = useState<number | "">(30);

    // --- Corequisite fields ---
    const [hasCoreq, setHasCoreq] = useState(false);
    const [coReqType, setCoReqType] = useState("lab");
    const [coReqDay, setCoReqDay] = useState("");
    const [coReqFrom, setCoReqFrom] = useState<number | "">("");
    const [coReqTo, setCoReqTo] = useState<number | "">("");
    const [coReqCapacity, setCoReqCapacity] = useState<number | "">(30);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
    const [submitting, setSubmitting] = useState(false);

    const hours = [
        "8 AM","9 AM","10 AM","11 AM","12 PM",
        "1 PM","2 PM","3 PM","4 PM","5 PM","6 PM","7 PM","8 PM"
    ];

    const timeToNumber = (timeStr: string): number => {
        const match = timeStr.match(/(\d+)/);
        if (!match) return 0;
        const num = parseInt(match[1]);
        if (timeStr.includes("PM") && num !== 12) return num + 12;
        if (timeStr.includes("AM") && num === 12) return 0;
        return num;
    };

    const numberToTime = (hour: number): string => {
        if (hour === undefined || hour === null) return "";
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:00 ${period}`;
    };

    const formatDay = (day: string): string =>
        day.charAt(0).toUpperCase() + day.slice(1);

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/groups");
            const data = await res.json();
            setGroups(Array.isArray(data) ? data : []);
        } catch (err) {
            console.log(err);
        }
    };

    const fetchSubjects = async () => {
        setLoadingSubjects(true);
        try {
            const res = await fetch("http://localhost:5000/api/subjects");
            const data = await res.json();
            setSubjects(Array.isArray(data) ? data : []);
            setSubjectsError(null);
        } catch (err) {
            const errorMessage = "Failed to load subjects. Please try again.";
            setSubjectsError(errorMessage);
            console.error(err);
        } finally {
            setLoadingSubjects(false);
        }
    };

    const validateForm = () => {
        const errors: {[key: string]: string} = {};

        if (!subject.trim()) errors.subject = "Subject is required";
        if (!number) errors.number = "Group number is required";
        if (!type) errors.type = "Type is required";
        if (!day) errors.day = "Day is required";
        if (!from) errors.from = "Start time is required";
        if (!to) errors.to = "End time is required";
        if (!capacity) errors.capacity = "Capacity is required";
        if (from && to && Number(from) >= Number(to)) errors.time = "End time must be after start time";

        if (hasCoreq) {
            if (!coReqType) errors.coReqType = "Corequisite type is required";
            if (!coReqDay) errors.coReqDay = "Corequisite day is required";
            if (!coReqFrom) errors.coReqFrom = "Corequisite start time is required";
            if (!coReqTo) errors.coReqTo = "Corequisite end time is required";
            if (!coReqCapacity) errors.coReqCapacity = "Corequisite capacity is required";
            if (coReqFrom && coReqTo && Number(coReqFrom) >= Number(coReqTo))
                errors.coReqTime = "Corequisite end time must be after start time";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const buildGroupData = (overrides: Partial<Group> = {}): any => ({
        subject: subject.trim().toLowerCase(),
        number: Number(number),
        type: type.toLowerCase(),
        day: day.toLowerCase(),
        from: Number(from),
        to: Number(to),
        capacity: Number(capacity),
        ...overrides
    });

    const postGroup = async (data: any) => {
        const res = await fetch("http://localhost:5000/api/groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to save group");
        }
        return res.json();
    };

    const putGroup = async (id: string, data: any) => {
        const res = await fetch(`http://localhost:5000/api/groups/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Failed to update group");
        }
        return res.json();
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        setSubmitting(true);

        try {
            if (editingId) {
                const updated = await putGroup(editingId, buildGroupData());
                setGroups(groups.map(g => g._id === editingId ? updated : g));
                setEditingId(null);
                alert("Group updated successfully!");
            } else {
                // Create lecture group
                const lectureGroup = await postGroup(buildGroupData());
                const newGroups: Group[] = [lectureGroup];

                // Create corequisite group alongside if requested
                if (hasCoreq) {
                    const coReqData = buildGroupData({
                        type: coReqType.toLowerCase(),
                        day: coReqDay.toLowerCase(),
                        from: Number(coReqFrom),
                        to: Number(coReqTo),
                        capacity: Number(coReqCapacity),
                    });
                    const coGroupSaved = await postGroup(coReqData);
                    newGroups.push(coGroupSaved);
                    alert(`✅ Groups added successfully!\n• ${type.charAt(0).toUpperCase() + type.slice(1)} group #${number}\n• ${coReqType.charAt(0).toUpperCase() + coReqType.slice(1)} group #${number}`);
                } else {
                    alert("Group added successfully!");
                }

                setGroups([...groups, ...newGroups]);
            }

            resetForm();
        } catch (err: any) {
            alert(err.message || "Error saving group");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSubject("");
        setNumber("");
        setType("lecture");
        setDay("");
        setFrom("");
        setTo("");
        setCapacity(30);
        setHasCoreq(false);
        setCoReqType("lab");
        setCoReqDay("");
        setCoReqFrom("");
        setCoReqTo("");
        setCoReqCapacity(30);
        setFormErrors({});
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this group?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/groups/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete group");
            setGroups(groups.filter(g => g._id !== id));
            alert("Group deleted successfully!");
        } catch (err) {
            alert("Error deleting group");
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
        setHasCoreq(false);
        setFormErrors({});
    };

    const handleCancel = () => {
        setEditingId(null);
        resetForm();
    };

    const getTypeStyle = (type: string) => {
        switch (type.toLowerCase()) {
            case "lecture": return { backgroundColor: "var(--color-info-bg)", color: "var(--color-info)" };
            case "lab": return { backgroundColor: "#f3e5f5", color: "#7b1fa2" };
            case "tutorial": return { backgroundColor: "var(--color-warning-bg)", color: "var(--color-warning)" };
            case "seminar": return { backgroundColor: "var(--color-success-bg)", color: "var(--color-success)" };
            default: return { backgroundColor: "var(--color-border)", color: "var(--color-text-muted)" };
        }
    };

    const inputStyle = (errKey: string) => ({
        padding: "10px",
        borderRadius: "6px",
        border: formErrors[errKey] ? "2px solid var(--color-error)" : "1px solid var(--color-border)",
        width: "100%",
        fontSize: "14px",
        backgroundColor: "white",
        boxSizing: "border-box" as const
    });

    const labelStyle: React.CSSProperties = {
        fontSize: "12px",
        color: "var(--color-text-muted)",
        display: "block",
        marginBottom: "4px",
        fontWeight: 600
    };

    const sectionStyle: React.CSSProperties = {
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        alignItems: "flex-start"
    };

    const fieldStyle = (width?: string): React.CSSProperties => ({
        flex: width ? "none" : "1",
        minWidth: "120px",
        width: width
    });

    const errorText = (key: string) =>
        formErrors[key] ? <span style={{ color: "var(--color-error)", fontSize: "11px" }}>{formErrors[key]}</span> : null;

    const DaySelect = ({ value, onChange, errKey }: { value: string, onChange: (v: string) => void, errKey: string }) => (
        <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle(errKey)}>
            <option value="">Select day</option>
            {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d =>
                <option key={d} value={d.toLowerCase()}>{d}</option>
            )}
        </select>
    );

    const TimeSelect = ({ value, onChange, errKey }: { value: number | "", onChange: (v: number | "") => void, errKey: string }) => (
        <select value={value} onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))} style={inputStyle(errKey)}>
            <option value="">Select</option>
            {hours.map(h => <option key={h} value={timeToNumber(h)}>{h}</option>)}
        </select>
    );

    return (
        <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
            <h2 style={{ color: "var(--color-text-secondary)", borderBottom: "2px solid var(--color-success)", paddingBottom: "10px" }}>
                {editingId ? "✏️ Update Group" : "➕ Add New Group"}
            </h2>

            {/* ===== MAIN GROUP FORM ===== */}
            <div style={{
                display: "flex", flexDirection: "column", gap: "15px",
                marginBottom: hasCoreq ? "0" : "30px", padding: "25px",
                backgroundColor: "var(--color-bg)", borderRadius: hasCoreq ? "10px 10px 0 0" : "10px",
                boxShadow: hasCoreq ? "0 2px 0 rgba(0,0,0,0.08)" : "0 2px 4px rgba(0,0,0,0.1)",
                borderBottom: hasCoreq ? "2px dashed var(--color-border)" : "none"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{
                        backgroundColor: "var(--color-info-bg)", color: "var(--color-info)",
                        padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700
                    }}>📚 LECTURE / MAIN GROUP</span>
                </div>

                <div style={sectionStyle}>
                    {/* Subject */}
                    <div style={fieldStyle()}>
                        <label style={labelStyle}>Subject *</label>
                        <select
                            value={subject}
                            onChange={e => { setSubject(e.target.value); setFormErrors(f => ({...f, subject: ""})); }}
                            style={inputStyle("subject")}
                        >
                            <option value="">Select subject</option>
                            {subjects.map(s => <option key={s._id} value={s.code.toLowerCase()}>{s.code.toUpperCase()}</option>)}
                        </select>
                        {errorText("subject")}
                    </div>

                    {/* Group Number */}
                    <div style={fieldStyle("100px")}>
                        <label style={labelStyle}>Group # *</label>
                        <input
                            type="number"
                            placeholder="1"
                            value={number}
                            onChange={e => { setNumber(Number(e.target.value)); setFormErrors(f => ({...f, number: ""})); }}
                            style={inputStyle("number")}
                        />
                        {errorText("number")}
                    </div>

                    {/* Type */}
                    <div style={fieldStyle("130px")}>
                        <label style={labelStyle}>Type *</label>
                        <select value={type} onChange={e => { setType(e.target.value); setFormErrors(f => ({...f, type: ""})); }} style={inputStyle("type")}>
                            <option value="lecture">📚 Lecture</option>
                            <option value="lab">🔬 Lab</option>
                            <option value="tutorial">📝 Tutorial</option>
                            <option value="seminar">🎤 Seminar</option>
                        </select>
                    </div>

                    {/* Day */}
                    <div style={fieldStyle("130px")}>
                        <label style={labelStyle}>Day *</label>
                        <DaySelect value={day} onChange={v => { setDay(v); setFormErrors(f => ({...f, day: ""})); }} errKey="day" />
                        {errorText("day")}
                    </div>

                    {/* From */}
                    <div style={fieldStyle("100px")}>
                        <label style={labelStyle}>From *</label>
                        <TimeSelect value={from} onChange={v => { setFrom(v); setFormErrors(f => ({...f, from: "", time: ""})); }} errKey="from" />
                        {errorText("from")}
                    </div>

                    {/* To */}
                    <div style={fieldStyle("100px")}>
                        <label style={labelStyle}>To *</label>
                        <TimeSelect value={to} onChange={v => { setTo(v); setFormErrors(f => ({...f, to: "", time: ""})); }} errKey="to" />
                        {errorText("to")}
                    </div>

                    {/* Capacity */}
                    <div style={fieldStyle("90px")}>
                        <label style={labelStyle}>Capacity *</label>
                        <input
                            type="number" min="1" value={capacity}
                            onChange={e => { setCapacity(Number(e.target.value)); setFormErrors(f => ({...f, capacity: ""})); }}
                            style={inputStyle("capacity")}
                        />
                        {errorText("capacity")}
                    </div>
                </div>

                {formErrors.time && (
                    <div style={{ color: "var(--color-error)", fontSize: "13px", padding: "8px", backgroundColor: "var(--color-error-bg)", borderRadius: "4px" }}>
                        ⚠️ {formErrors.time}
                    </div>
                )}

                {/* Corequisite toggle — only when adding */}
                {!editingId && (
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginTop: "4px", userSelect: "none" }}>
                        <input
                            type="checkbox"
                            checked={hasCoreq}
                            onChange={e => setHasCoreq(e.target.checked)}
                            style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                            Add corequisite group (Lab / Tutorial) at the same time
                        </span>
                    </label>
                )}
            </div>

            {/* ===== COREQUISITE FORM ===== */}
            {hasCoreq && !editingId && (
                <div style={{
                    display: "flex", flexDirection: "column", gap: "15px",
                    marginBottom: "30px", padding: "25px",
                    backgroundColor: "#fdf6ff",
                    borderRadius: "0 0 10px 10px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    borderTop: "none"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{
                            backgroundColor: "#f3e5f5", color: "#7b1fa2",
                            padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 700
                        }}>🔬 COREQUISITE GROUP (same subject &amp; group #)</span>
                    </div>

                    <div style={sectionStyle}>
                        {/* Subject (readonly display) */}
                        <div style={fieldStyle()}>
                            <label style={labelStyle}>Subject (inherited)</label>
                            <input
                                value={subject ? subject.toUpperCase() : "—"}
                                disabled
                                style={{ ...inputStyle(""), backgroundColor: "#f5f5f5", color: "#888", cursor: "not-allowed" }}
                            />
                        </div>

                        {/* Group # (readonly display) */}
                        <div style={fieldStyle("100px")}>
                            <label style={labelStyle}>Group # (inherited)</label>
                            <input
                                value={number !== "" ? number : "—"}
                                disabled
                                style={{ ...inputStyle(""), backgroundColor: "#f5f5f5", color: "#888", cursor: "not-allowed" }}
                            />
                        </div>

                        {/* Coreq Type */}
                        <div style={fieldStyle("130px")}>
                            <label style={labelStyle}>Type *</label>
                            <select value={coReqType} onChange={e => { setCoReqType(e.target.value); setFormErrors(f => ({...f, coReqType: ""})); }} style={inputStyle("coReqType")}>
                                <option value="lab">🔬 Lab</option>
                                <option value="tutorial">📝 Tutorial</option>
                                <option value="seminar">🎤 Seminar</option>
                            </select>
                            {errorText("coReqType")}
                        </div>

                        {/* Coreq Day */}
                        <div style={fieldStyle("130px")}>
                            <label style={labelStyle}>Day *</label>
                            <DaySelect value={coReqDay} onChange={v => { setCoReqDay(v); setFormErrors(f => ({...f, coReqDay: ""})); }} errKey="coReqDay" />
                            {errorText("coReqDay")}
                        </div>

                        {/* Coreq From */}
                        <div style={fieldStyle("100px")}>
                            <label style={labelStyle}>From *</label>
                            <TimeSelect value={coReqFrom} onChange={v => { setCoReqFrom(v); setFormErrors(f => ({...f, coReqFrom: "", coReqTime: ""})); }} errKey="coReqFrom" />
                            {errorText("coReqFrom")}
                        </div>

                        {/* Coreq To */}
                        <div style={fieldStyle("100px")}>
                            <label style={labelStyle}>To *</label>
                            <TimeSelect value={coReqTo} onChange={v => { setCoReqTo(v); setFormErrors(f => ({...f, coReqTo: "", coReqTime: ""})); }} errKey="coReqTo" />
                            {errorText("coReqTo")}
                        </div>

                        {/* Coreq Capacity */}
                        <div style={fieldStyle("90px")}>
                            <label style={labelStyle}>Capacity *</label>
                            <input
                                type="number" min="1" value={coReqCapacity}
                                onChange={e => { setCoReqCapacity(Number(e.target.value)); setFormErrors(f => ({...f, coReqCapacity: ""})); }}
                                style={inputStyle("coReqCapacity")}
                            />
                            {errorText("coReqCapacity")}
                        </div>
                    </div>

                    {formErrors.coReqTime && (
                        <div style={{ color: "var(--color-error)", fontSize: "13px", padding: "8px", backgroundColor: "var(--color-error-bg)", borderRadius: "4px" }}>
                            ⚠️ {formErrors.coReqTime}
                        </div>
                    )}
                </div>
            )}

            {/* ===== ACTION BUTTONS ===== */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "30px", marginTop: hasCoreq ? "0" : "-10px" }}>
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                        padding: "11px 24px",
                        backgroundColor: editingId ? "var(--color-info)" : "var(--color-success)",
                        color: "white", border: "none", borderRadius: "6px",
                        cursor: submitting ? "wait" : "pointer",
                        fontWeight: "bold", fontSize: "14px",
                        opacity: submitting ? 0.7 : 1,
                        transition: "opacity 0.2s"
                    }}
                >
                    {submitting ? "⏳ Saving..." : editingId ? "✏️ Update Group" : hasCoreq ? "➕ Add Both Groups" : "➕ Add Group"}
                </button>

                {editingId && (
                    <button
                        onClick={handleCancel}
                        style={{
                            padding: "11px 24px",
                            backgroundColor: "var(--color-error)",
                            color: "white", border: "none", borderRadius: "6px",
                            cursor: "pointer", fontWeight: "bold", fontSize: "14px"
                        }}
                    >
                        ✕ Cancel
                    </button>
                )}
            </div>

            {/* ===== GROUPS TABLE ===== */}
            <h2 style={{ color: "var(--color-text-secondary)", borderBottom: "2px solid var(--color-success)", paddingBottom: "10px" }}>
                📊 Groups Dashboard ({groups.length})
            </h2>

            {groups.length === 0 ? (
                <div style={{
                    textAlign: "center", padding: "60px",
                    backgroundColor: "var(--color-bg)", borderRadius: "8px",
                    color: "var(--color-text-muted)", fontSize: "16px"
                }}>
                    📭 No groups found. Add your first group above!
                </div>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table style={{
                        width: "100%", borderCollapse: "collapse",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        borderRadius: "8px", overflow: "hidden"
                    }}>
                        <thead>
                        <tr style={{ backgroundColor: "var(--color-success)", color: "white" }}>
                            {["Subject","Group #","Type","Day","From","To","Capacity","Students","Actions"].map(h =>
                                <th key={h} style={{ padding: "14px", textAlign: "left" }}>{h}</th>
                            )}
                        </tr>
                        </thead>
                        <tbody>
                        {groups.map((group, index) => (
                            <tr
                                key={group._id}
                                style={{
                                    backgroundColor: index % 2 === 0 ? "var(--color-bg)" : "white",
                                    borderBottom: "1px solid var(--color-border)",
                                    transition: "background-color 0.2s"
                                }}
                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f1f8e9")}
                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = index % 2 === 0 ? "var(--color-bg)" : "white")}
                            >
                                <td style={{ padding: "14px", fontWeight: "bold" }}>{group.subject.toUpperCase()}</td>
                                <td style={{ padding: "14px" }}>{group.number}</td>
                                <td style={{ padding: "14px" }}>
                                    <span style={{ padding: "5px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 500, display: "inline-block", ...getTypeStyle(group.type) }}>
                                        {group.type.charAt(0).toUpperCase() + group.type.slice(1)}
                                    </span>
                                </td>
                                <td style={{ padding: "14px" }}>{formatDay(group.day)}</td>
                                <td style={{ padding: "14px", fontWeight: 500 }}>{numberToTime(group.from)}</td>
                                <td style={{ padding: "14px", fontWeight: 500 }}>{numberToTime(group.to)}</td>
                                <td style={{ padding: "14px" }}>
                                    <span style={{ backgroundColor: "var(--color-success-bg)", padding: "4px 8px", borderRadius: "4px", color: "var(--color-success)", fontWeight: 500 }}>
                                        {group.capacity}
                                    </span>
                                </td>
                                <td style={{ padding: "14px" }}>
                                    <span style={{ backgroundColor: "var(--color-warning-bg)", padding: "4px 8px", borderRadius: "4px", color: "var(--color-warning)", fontWeight: 500 }}>
                                        {group.students?.length || 0}
                                    </span>
                                </td>
                                <td style={{ padding: "14px" }}>
                                    <button
                                        onClick={() => handleEdit(group)}
                                        style={{ padding: "6px 12px", marginRight: "6px", backgroundColor: "var(--color-info)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(group._id!)}
                                        style={{ padding: "6px 12px", backgroundColor: "var(--color-error)", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
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