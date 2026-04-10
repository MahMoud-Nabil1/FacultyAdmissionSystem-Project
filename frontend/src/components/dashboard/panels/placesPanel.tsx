import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getAllPlaces, createPlace, updatePlace, deletePlace } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

interface Place {
    _id: string;
    name: string;
    type: 'hall' | 'room' | 'lab' | 'lecture_hall';
    capacity: number;
    building?: string;
    floor?: number;
    isActive: boolean;
}

const PlacesPanel: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [places, setPlaces] = useState<Place[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formName, setFormName] = useState("");
    const [formType, setFormType] = useState<'hall' | 'room' | 'lab' | 'lecture_hall'>("lecture_hall");
    const [formCapacity, setFormCapacity] = useState("");
    const [formBuilding, setFormBuilding] = useState("");
    const [formFloor, setFormFloor] = useState("");
    const [formIsActive, setFormIsActive] = useState(true);
    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

    useEffect(() => {
        fetchPlaces();
    }, []);

    const fetchPlaces = async () => {
        try {
            const data = await getAllPlaces();
            setPlaces(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch places", err);
        }
    };

    const validateForm = () => {
        const errors: {[key: string]: string} = {};
        if (!formName.trim()) errors.formName = "Name is required";
        if (!formCapacity) errors.formCapacity = "Capacity is required";
        if (formCapacity && Number(formCapacity) < 1) errors.formCapacity = "Capacity must be at least 1";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            const payload: any = {
                name: formName.trim(),
                type: formType,
                capacity: Number(formCapacity),
                isActive: formIsActive,
            };
            if (formBuilding.trim()) payload.building = formBuilding.trim();
            if (formFloor) payload.floor = Number(formFloor);

            if (editingId) {
                const updated = await updatePlace(editingId, payload);
                setPlaces(places.map(p => p._id === editingId ? updated : p));
                alert("Place updated successfully!");
            } else {
                const created = await createPlace(payload);
                setPlaces([...places, created]);
                alert("Place added successfully!");
            }
            closeModal();
        } catch (err: any) {
            alert(err.message || "Error saving place");
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormName("");
        setFormType("lecture_hall");
        setFormCapacity("");
        setFormBuilding("");
        setFormFloor("");
        setFormIsActive(true);
        setFormErrors({});
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        resetForm();
    };

    const handleEdit = (place: Place) => {
        setEditingId(place._id);
        setFormName(place.name);
        setFormType(place.type);
        setFormCapacity(String(place.capacity));
        setFormBuilding(place.building || "");
        setFormFloor(place.floor !== undefined ? String(place.floor) : "");
        setFormIsActive(place.isActive);
        setFormErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this place?")) return;
        try {
            await deletePlace(id);
            setPlaces(places.filter(p => p._id !== id));
            alert("Place deleted successfully!");
        } catch (err: any) {
            alert(err.message || "Error deleting place");
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            hall: "Hall",
            room: "Room",
            lab: "Lab",
            lecture_hall: "Lecture Hall"
        };
        return labels[type] || type;
    };

    const filteredPlaces = places.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTypeLabel(p.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.building || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-container">
            <div className="table-header">
                <h2>Places Management ({places.length})</h2>
                {isAdmin && (
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add Place
                    </button>
                )}
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <input
                    type="text"
                    placeholder="Search places..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ padding: "8px", flex: "1 1 200px" }}
                />
            </div>

            <table className="staff-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Capacity</th>
                        <th>Building</th>
                        <th>Floor</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPlaces.map(place => (
                        <tr
                            key={place._id}
                            onClick={() => isAdmin && handleEdit(place)}
                            style={{ cursor: isAdmin ? "pointer" : "default" }}
                        >
                            <td>{place.name}</td>
                            <td>
                                <span className={`badge badge-${place.type === 'hall' ? 'success' : place.type === 'lecture_hall' ? 'info' : place.type === 'lab' ? 'primary' : 'warning'}`}>
                                    {getTypeLabel(place.type)}
                                </span>
                            </td>
                            <td>{place.capacity}</td>
                            <td>{place.building || "—"}</td>
                            <td>{place.floor !== undefined ? place.floor : "—"}</td>
                            <td>
                                <span className={`badge badge-${place.isActive ? 'success' : 'danger'}`}>
                                    {place.isActive ? "Active" : "Inactive"}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {filteredPlaces.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: "center" }}>
                                No places found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Add/Edit Modal - Only for Admin */}
            {isAdmin && showModal && (
                <div className="modal-overlay" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeModal();
                }}>
                    <div className="modal-content" style={{ maxWidth: "600px" }}>
                        <div className="modal-header">
                            <h3>{editingId ? "Edit Place" : "Add Place"}</h3>
                            <button className="modal-close" onClick={closeModal} type="button">×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                {editingId && (
                                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                                        <button
                                            type="button"
                                            className="delete-btn"
                                            onClick={() => {
                                                if (editingId && window.confirm("Are you sure you want to delete this place?")) {
                                                    handleDelete(editingId);
                                                    closeModal();
                                                }
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}

                                {/* Name */}
                                <div className="form-group">
                                    <label>Name *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Hall A, Room 101"
                                        value={formName}
                                        onChange={e => { setFormName(e.target.value); setFormErrors(f => ({...f, formName: ""})); }}
                                    />
                                    {formErrors.formName && <span className="error">{formErrors.formName}</span>}
                                </div>

                                {/* Type & Capacity */}
                                <div className="settings-form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Type *</label>
                                        <select value={formType} onChange={e => setFormType(e.target.value as any)}>
                                            <option value="lecture_hall">Lecture Hall</option>
                                            <option value="hall">Hall</option>
                                            <option value="room">Room</option>
                                            <option value="lab">Lab</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Capacity *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="50"
                                            value={formCapacity}
                                            onChange={e => { setFormCapacity(e.target.value); setFormErrors(f => ({...f, formCapacity: ""})); }}
                                        />
                                        {formErrors.formCapacity && <span className="error">{formErrors.formCapacity}</span>}
                                    </div>
                                </div>

                                {/* Building & Floor */}
                                <div className="settings-form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Building</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Main Building"
                                            value={formBuilding}
                                            onChange={e => setFormBuilding(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Floor</label>
                                        <input
                                            type="number"
                                            placeholder="1"
                                            value={formFloor}
                                            onChange={e => setFormFloor(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Active toggle */}
                                <label className="settings-level-option" style={{ marginTop: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <input
                                        type="checkbox"
                                        checked={formIsActive}
                                        onChange={e => setFormIsActive(e.target.checked)}
                                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                    />
                                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)" }}>
                                        Active
                                    </span>
                                </label>

                                <div className="modal-footer">
                                    <button type="button" className="cancel-btn" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="submit-btn" disabled={submitting}>
                                        {submitting ? "Saving..." : editingId ? "Update" : "Save"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlacesPanel;
