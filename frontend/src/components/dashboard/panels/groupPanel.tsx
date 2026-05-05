import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import Pagination from "../pagination";
import { PAGE_SIZE } from "../../../services/constants";
import { getAllSubjects, getAllPlaces, apiGet, apiPost, apiPut, apiDelete } from "../../../services/api";

interface Group {
    _id?: string;
    subject: string;
    number: number;
    type: string;
    day: string;
    from: number;
    to: number;
    capacity: number;
    students?: any[];
    place: string;
}

const GroupPanel: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    const [groups, setGroups] = useState<Group[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(0);

    const { t } = useTranslation();

    // --- Subjects state management ---
    const [subjects, setSubjects] = useState<Array<{_id: string, code: string, name: string}>>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [subjectsError, setSubjectsError] = useState<string | null>(null);

    // --- Places state management ---
    const [places, setPlaces] = useState<Array<{_id: string, name: string, capacity: number}>>([]);
    const [loadingPlaces, setLoadingPlaces] = useState(false);

    // --- Modal state ---
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    // --- Lecture (main group) fields ---
    const [subject, setSubject] = useState("");
    const [number, setNumber] = useState<number | "">("");
    const [type, setType] = useState("lecture");
    const [day, setDay] = useState("");
    const [from, setFrom] = useState<number | "">("");
    const [to, setTo] = useState<number | "">("");
    const [capacity, setCapacity] = useState<number | "">("");
    const [place, setPlace] = useState("");

    // --- Corequisite fields ---
    const [hasCoreq, setHasCoreq] = useState(false);
    const [coReqType, setCoReqType] = useState("lab");
    const [coReqDay, setCoReqDay] = useState("");
    const [coReqFrom, setCoReqFrom] = useState<number | "">("");
    const [coReqTo, setCoReqTo] = useState<number | "">("");
    const [coReqCapacity, setCoReqCapacity] = useState<number | "">("");

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

    const selectedPlace = useMemo(
        () => places.find(p => p._id === place) ?? null,
        [places, place]
    );

    const normalizeCapacityForPlace = (value: number | "", maxCapacity?: number): number | "" => {
        if (!maxCapacity) return value;
        if (value === "") return maxCapacity;

        const numericValue = Number(value);
        if (Number.isNaN(numericValue) || numericValue < 1) return maxCapacity;

        return Math.min(numericValue, maxCapacity);
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        fetchPlaces();
    }, []);

    useEffect(() => {
        if (!selectedPlace || editingId) return;

        setCapacity(currentValue => normalizeCapacityForPlace(currentValue, selectedPlace.capacity));
        setCoReqCapacity(currentValue => normalizeCapacityForPlace(currentValue, selectedPlace.capacity));
    }, [selectedPlace, editingId]);

    useEffect(() => {
        setPage(0);
    }, [searchTerm]);

    const fetchGroups = async () => {
        try {
            const { res, data } = await apiGet("/groups");
            if (res.ok) {
                setGroups(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.log(err);
        }
    };

    const fetchSubjects = async () => {
        setLoadingSubjects(true);
        try {
            const data = await getAllSubjects();
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

    const fetchPlaces = async () => {
        setLoadingPlaces(true);
        try {
            const data = await getAllPlaces();
            setPlaces(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch places", err);
        } finally {
            setLoadingPlaces(false);
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
        if (!place) errors.place = "Place is required";
        if (from && to && Number(from) >= Number(to)) errors.time = "End time must be after start time";
        if (selectedPlace && capacity && Number(capacity) > selectedPlace.capacity) {
            errors.capacity = t("groupPanel.placeCapacityExceeded", { capacity: selectedPlace.capacity });
        }

        if (hasCoreq) {
            if (!coReqType) errors.coReqType = "Corequisite type is required";
            if (!coReqDay) errors.coReqDay = "Corequisite day is required";
            if (!coReqFrom) errors.coReqFrom = "Corequisite start time is required";
            if (!coReqTo) errors.coReqTo = "Corequisite end time is required";
            if (!coReqCapacity) errors.coReqCapacity = "Corequisite capacity is required";
            if (coReqFrom && coReqTo && Number(coReqFrom) >= Number(coReqTo))
                errors.coReqTime = "Corequisite end time must be after start time";
            if (selectedPlace && coReqCapacity && Number(coReqCapacity) > selectedPlace.capacity) {
                errors.coReqCapacity = t("groupPanel.placeCapacityExceeded", { capacity: selectedPlace.capacity });
            }
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
        place: place,
        ...overrides
    });

    const postGroup = async (data: any) => {
        const { res, data: responseData } = await apiPost("/groups", data);
        if (!res.ok) {
            throw new Error(responseData.error || "Failed to save group");
        }
        return responseData;
    };

    const putGroup = async (id: string, data: any) => {
        const { res, data: responseData } = await apiPut(`/groups/${id}`, data);
        if (!res.ok) {
            throw new Error(responseData.error || "Failed to update group");
        }
        return responseData;
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
                    alert(`Groups added successfully!\n• ${type.charAt(0).toUpperCase() + type.slice(1)} group #${number}\n• ${coReqType.charAt(0).toUpperCase() + coReqType.slice(1)} group #${number}`);
                } else {
                    alert("Group added successfully!");
                }

                setGroups([...groups, ...newGroups]);
            }

            closeModal();
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
        setCapacity("");
        setPlace("");
        setHasCoreq(false);
        setCoReqType("lab");
        setCoReqDay("");
        setCoReqFrom("");
        setCoReqTo("");
        setCoReqCapacity("");
        setFormErrors({});
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        resetForm();
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this group?")) return;
        try {
            const { res } = await apiDelete(`/groups/${id}`);
            if (res.ok) {
                setGroups(groups.filter(g => g._id !== id));
                alert("Group deleted successfully!");
            }
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
        setPlace((group as any).place?._id || group.place || "");
        setHasCoreq(false);
        setFormErrors({});
        setShowModal(true);
    };

    const handleRowClick = (group: Group) => {
        if (isAdmin) {
            handleEdit(group);
            return;
        }
        setSelectedGroup(group);
        setShowDetailsModal(true);
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

    const exportStudentsCsv = () => {
        if (!selectedGroup?.students?.length) return;

        const rows = [
            ["studentId", "name"],
            ...selectedGroup.students.map((student: any) => [
                student.studentId || student.id || student._id || "",
                student.name || "",
            ]),
        ];

        const csvContent = rows
            .map(row => row
                .map(field => `"${String(field).replace(/"/g, '""')}"`)
                .join(","))
            .join("\r\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `group-${selectedGroup.subject || "group"}-${selectedGroup.number || "list"}-students.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const filteredGroups = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return groups;
        return groups.filter(g => (
            g.subject?.toLowerCase().includes(term) ||
            String(g.number).includes(term) ||
            g.type?.toLowerCase().includes(term) ||
            g.day?.toLowerCase().includes(term) ||
            String(g.capacity).includes(term) ||
            String(g.students?.length ?? 0).includes(term)
        ));
    }, [groups, searchTerm]);

    const paginatedGroups = filteredGroups.slice(
        page * PAGE_SIZE,
        page * PAGE_SIZE + PAGE_SIZE
    );

    const tableHeaders = [
        t("groupPanel.columnSubject"),
        t("groupPanel.columnGroupNumber"),
        t("groupPanel.columnType"),
        t("groupPanel.columnDay"),
        t("groupPanel.columnFrom"),
        t("groupPanel.columnTo"),
        t("groupPanel.placeLabel"),
    ];

    const placeMap = useMemo(() => {
        const map = new Map<string, string>();
        places.forEach(p => map.set(p._id, p.name));
        return map;
    }, [places]);

    return (
        <div className="dashboard-container">
            <div className="table-header">
                <h2>{t("groupPanel.tableTitle", { count: groups.length })}</h2>
                {isAdmin && (
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + {t("groupPanel.addBtn")}
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <input
                    type="text"
                    placeholder={t("groupPanel.searchPlaceholder")}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ padding: "8px", flex: "1 1 200px" }}
                />
            </div>

            {/* Groups Table */}
            <table className="staff-table">
                <thead>
                    <tr>
                        {tableHeaders.map(h => (
                            <th key={h}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {paginatedGroups.map(group => (
                        <tr
                            key={group._id}
                            onClick={() => handleRowClick(group)}
                            style={{ cursor: "pointer" }}
                        >
                            <td>{group.subject.toUpperCase()}</td>
                            <td>{group.number}</td>
                            <td>
                                <span className={`badge badge-${group.type === 'lecture' ? 'info' : group.type === 'lab' ? 'primary' : group.type === 'tutorial' ? 'warning' : 'success'}`}>
                                    {group.type.charAt(0).toUpperCase() + group.type.slice(1)}
                                </span>
                            </td>
                            <td>{formatDay(group.day)}</td>
                            <td>{numberToTime(group.from)}</td>
                            <td>{numberToTime(group.to)}</td>
                            <td>{placeMap.get((group as any).place) || (group as any).place || "—"}</td>
                        </tr>
                    ))}
                    {paginatedGroups.length === 0 && (
                        <tr>
                            <td colSpan={tableHeaders.length} style={{ textAlign: "center" }}>
                                {t("dashboardCommon.noResults")}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <Pagination
                page={page}
                setPage={setPage}
                total={filteredGroups.length}
            />

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeModal();
                }}>
                    <div className="modal-content" style={{ maxWidth: "900px" }}>
                        <div className="modal-header">
                            <h3>{editingId ? t("groupPanel.editHeader") : t("groupPanel.addHeader")}</h3>
                            <button className="modal-close" onClick={closeModal} type="button">×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                                {subjectsError && <p className="error">{subjectsError}</p>}

                                {/* Action buttons in modal header */}
                                {editingId && (
                                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                                        <button
                                            type="button"
                                            className="delete-btn"
                                            onClick={() => {
                                                if (editingId && window.confirm("Are you sure you want to delete this group?")) {
                                                    handleDelete(editingId);
                                                    closeModal();
                                                }
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}

                                {/* Subject */}
                                <div className="form-group">
                                    <label>{t("groupPanel.subjectLabel")} *</label>
                                    <select
                                        value={subject}
                                        onChange={e => { setSubject(e.target.value); setFormErrors(f => ({...f, subject: ""})); }}
                                        disabled={loadingSubjects}
                                    >
                                        <option value="">
                                            {loadingSubjects ? "Loading subjects..." : "Select subject"}
                                        </option>
                                        {subjects.map(s => (
                                            <option key={s._id} value={s.code.toLowerCase()}>
                                                {s.code.toUpperCase()} - {s.name}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.subject && <span className="error">{formErrors.subject}</span>}
                                </div>

                                {/* Group Number and Type */}
                                <div className="settings-form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>{t("groupPanel.groupNumberLabel")} *</label>
                                        <input
                                            type="number"
                                            placeholder="1"
                                            value={number}
                                            onChange={e => { setNumber(Number(e.target.value)); setFormErrors(f => ({...f, number: ""})); }}
                                        />
                                        {formErrors.number && <span className="error">{formErrors.number}</span>}
                                    </div>

                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>{t("groupPanel.typeLabel")} *</label>
                                        <select value={type} onChange={e => { setType(e.target.value); setFormErrors(f => ({...f, type: ""})); }}>
                                            <option value="lecture">Lecture</option>
                                            <option value="lab">Lab</option>
                                            <option value="tutorial">Tutorial</option>
                                            <option value="seminar">Seminar</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Day and Time */}
                                <div className="settings-form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>{t("groupPanel.dayLabel")} *</label>
                                        <select value={day} onChange={e => { setDay(e.target.value); setFormErrors(f => ({...f, day: ""})); }}>
                                            <option value="">Select day</option>
                                            {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d =>
                                                <option key={d} value={d.toLowerCase()}>{d}</option>
                                            )}
                                        </select>
                                        {formErrors.day && <span className="error">{formErrors.day}</span>}
                                    </div>

                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>{t("groupPanel.fromLabel")} *</label>
                                        <select value={from} onChange={e => { setFrom(e.target.value === "" ? "" : Number(e.target.value)); setFormErrors(f => ({...f, from: "", time: ""})); }}>
                                            <option value="">Select</option>
                                            {hours.map(h => <option key={h} value={timeToNumber(h)}>{h}</option>)}
                                        </select>
                                        {formErrors.from && <span className="error">{formErrors.from}</span>}
                                    </div>

                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>{t("groupPanel.toLabel")} *</label>
                                        <select value={to} onChange={e => { setTo(e.target.value === "" ? "" : Number(e.target.value)); setFormErrors(f => ({...f, to: "", time: ""})); }}>
                                            <option value="">Select</option>
                                            {hours.map(h => <option key={h} value={timeToNumber(h)}>{h}</option>)}
                                        </select>
                                        {formErrors.to && <span className="error">{formErrors.to}</span>}
                                    </div>
                                </div>

                                {formErrors.time && (
                                    <div className="error">{formErrors.time}</div>
                                )}

                                {/* Place */}
                                <div className="form-group">
                                    <label>{t("groupPanel.placeLabel")} *</label>
                                    <select
                                        value={place}
                                        onChange={e => { setPlace(e.target.value); setFormErrors(f => ({...f, place: ""})); }}
                                        disabled={loadingPlaces}
                                    >
                                        <option value="">
                                            {loadingPlaces ? t("groupPanel.placeLoading") : t("groupPanel.placeSelectPlaceholder")}
                                        </option>
                                        {places.filter(p => p.name).map(p => (
                                            <option key={p._id} value={p._id}>
                                                {t("groupPanel.placeOption", { name: p.name, capacity: p.capacity })}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.place && <span className="error">{formErrors.place}</span>}
                                </div>

                                {/* Capacity */}
                                <div className="form-group">
                                    <label>{t("groupPanel.capacityLabel")} *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedPlace?.capacity}
                                        value={capacity}
                                        onChange={e => {
                                            const value = e.target.value;
                                            setCapacity(value === "" ? "" : Number(value));
                                            setFormErrors(f => ({...f, capacity: ""}));
                                        }}
                                    />
                                    {selectedPlace && (
                                        <small style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                                            {t("groupPanel.placeCapacityHint", { capacity: selectedPlace.capacity })}
                                        </small>
                                    )}
                                    {formErrors.capacity && <span className="error">{formErrors.capacity}</span>}
                                </div>

                                {/* Corequisite toggle — only when adding */}
                                {!editingId && (
                                    <label className="settings-level-option" style={{ marginTop: "8px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={hasCoreq}
                                            onChange={e => setHasCoreq(e.target.checked)}
                                            style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                        />
                                        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)" }}>
                                            Add corequisite group (Lab / Tutorial) at the same time
                                        </span>
                                    </label>
                                )}

                                {/* Corequisite fields */}
                                {hasCoreq && !editingId && (
                                    <>
                                        <div className="settings-form-row">
                                            <div className="form-group" style={{ flex: 1 }}>
                                                <label>{t("groupPanel.typeLabel")} *</label>
                                                <select value={coReqType} onChange={e => { setCoReqType(e.target.value); setFormErrors(f => ({...f, coReqType: ""})); }}>
                                                    <option value="lab">Lab</option>
                                                    <option value="tutorial">Tutorial</option>
                                                    <option value="seminar">Seminar</option>
                                                </select>
                                                {formErrors.coReqType && <span className="error">{formErrors.coReqType}</span>}
                                            </div>

                                            <div className="form-group" style={{ flex: 1 }}>
                                                <label>{t("groupPanel.dayLabel")} *</label>
                                                <select value={coReqDay} onChange={e => { setCoReqDay(e.target.value); setFormErrors(f => ({...f, coReqDay: ""})); }}>
                                                    <option value="">Select day</option>
                                                    {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d =>
                                                        <option key={d} value={d.toLowerCase()}>{d}</option>
                                                    )}
                                                </select>
                                                {formErrors.coReqDay && <span className="error">{formErrors.coReqDay}</span>}
                                            </div>
                                        </div>

                                        <div className="settings-form-row">
                                            <div className="form-group" style={{ flex: 1 }}>
                                                <label>{t("groupPanel.fromLabel")} *</label>
                                                <select value={coReqFrom} onChange={e => { setCoReqFrom(e.target.value === "" ? "" : Number(e.target.value)); setFormErrors(f => ({...f, coReqFrom: "", coReqTime: ""})); }}>
                                                    <option value="">Select</option>
                                                    {hours.map(h => <option key={h} value={timeToNumber(h)}>{h}</option>)}
                                                </select>
                                                {formErrors.coReqFrom && <span className="error">{formErrors.coReqFrom}</span>}
                                            </div>

                                            <div className="form-group" style={{ flex: 1 }}>
                                                <label>{t("groupPanel.toLabel")} *</label>
                                                <select value={coReqTo} onChange={e => { setCoReqTo(e.target.value === "" ? "" : Number(e.target.value)); setFormErrors(f => ({...f, coReqTo: "", coReqTime: ""})); }}>
                                                    <option value="">Select</option>
                                                    {hours.map(h => <option key={h} value={timeToNumber(h)}>{h}</option>)}
                                                </select>
                                                {formErrors.coReqTo && <span className="error">{formErrors.coReqTo}</span>}
                                            </div>

                                            <div className="form-group" style={{ flex: 1 }}>
                                                <label>{t("groupPanel.capacityLabel")} *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={selectedPlace?.capacity}
                                                    value={coReqCapacity}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setCoReqCapacity(value === "" ? "" : Number(value));
                                                        setFormErrors(f => ({...f, coReqCapacity: ""}));
                                                    }}
                                                />
                                                {selectedPlace && (
                                                    <small style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                                                        {t("groupPanel.placeCapacityHint", { capacity: selectedPlace.capacity })}
                                                    </small>
                                                )}
                                                {formErrors.coReqCapacity && <span className="error">{formErrors.coReqCapacity}</span>}
                                            </div>
                                        </div>

                                        {formErrors.coReqTime && (
                                            <div className="error">{formErrors.coReqTime}</div>
                                        )}
                                    </>
                                )}

                                <div className="modal-footer">
                                    <button type="button" className="cancel-btn" onClick={closeModal}>
                                        {t("dashboardCommon.cancel")}
                                    </button>
                                    <button type="submit" className="submit-btn" disabled={submitting}>
                                        {submitting ? t("studentPanel.loadingBtn") : editingId ? t("groupPanel.updateBtn") : hasCoreq ? t("groupPanel.addBothBtn") : t("subjectPanel.saveBtn")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showDetailsModal && selectedGroup && (
                <div className="modal-overlay" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowDetailsModal(false);
                        setSelectedGroup(null);
                    }
                }}>
                    <div className="modal-content" style={{ maxWidth: "700px" }}>
                        <div className="modal-header">
                            <h3>{t("groupPanel.detailsHeader")}</h3>
                            <button className="modal-close" onClick={() => { setShowDetailsModal(false); setSelectedGroup(null); }} type="button">×</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ marginBottom: "16px" }}>
                                <p><strong>{t("groupPanel.columnSubject")}:</strong> {selectedGroup.subject.toUpperCase()}</p>
                                <p><strong>{t("groupPanel.columnGroupNumber")}:</strong> {selectedGroup.number}</p>
                                <p><strong>{t("groupPanel.columnType")}:</strong> {selectedGroup.type}</p>
                                <p><strong>{t("groupPanel.columnDay")}:</strong> {formatDay(selectedGroup.day)}</p>
                                <p><strong>{t("groupPanel.columnFrom")}:</strong> {numberToTime(selectedGroup.from)}</p>
                                <p><strong>{t("groupPanel.columnTo")}:</strong> {numberToTime(selectedGroup.to)}</p>
                                <p><strong>{t("groupPanel.placeLabel") || "Place"}:</strong> {placeMap.get((selectedGroup as any).place) || (selectedGroup as any).place || "—"}</p>
                                <p><strong>{t("groupPanel.capacityLabel")}:</strong> {selectedGroup.capacity}</p>
                                <p><strong>{t("groupPanel.studentsLabel") || "Enrolled Students"}:</strong> {selectedGroup.students?.length ?? 0}</p>
                            </div>
                            <div>
                                <p>
                                    <strong>{t("groupPanel.studentsLabel") || "Students"}:</strong>
                                    {` ${selectedGroup.students?.length ?? 0}`}
                                </p>
                                <button
                                    type="button"
                                    className="add-btn"
                                    onClick={exportStudentsCsv}
                                    disabled={!selectedGroup.students?.length}
                                >
                                    {t("groupPanel.exportStudentsBtn")}
                                </button>
                                {!selectedGroup.students?.length && (
                                    <p>{t("groupPanel.noStudents") || "No students are enrolled in this group."}</p>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="cancel-btn" onClick={() => { setShowDetailsModal(false); setSelectedGroup(null); }}>
                                {t("dashboardCommon.close") || "Close"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupPanel;
