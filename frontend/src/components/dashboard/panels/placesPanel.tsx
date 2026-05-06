import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPlace, deletePlace, getAllPlaces, updatePlace } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

interface Place {
    _id: string;
    name: string;
    type: "hall" | "room" | "lab" | "lecture_hall";
    capacity: number;
    building?: string;
    floor?: number;
    isActive: boolean;
}

const PlacesPanel: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";
    const [places, setPlaces] = useState<Place[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [formName, setFormName] = useState("");
    const [formType, setFormType] = useState<"hall" | "room" | "lab" | "lecture_hall">("lecture_hall");
    const [formCapacity, setFormCapacity] = useState("");
    const [formBuilding, setFormBuilding] = useState("");
    const [formFloor, setFormFloor] = useState("");
    const [formIsActive, setFormIsActive] = useState(true);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

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
        const errors: { [key: string]: string } = {};

        if (!formName.trim()) errors.formName = t("placesPanel.validation.nameRequired");
        if (!formCapacity) errors.formCapacity = t("placesPanel.validation.capacityRequired");
        if (formCapacity && Number(formCapacity) < 1) {
            errors.formCapacity = t("placesPanel.validation.capacityMin");
        }

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
                setPlaces(places.map(place => (place._id === editingId ? updated : place)));
                alert(t("placesPanel.messages.updateSuccess"));
            } else {
                const created = await createPlace(payload);
                setPlaces([...places, created]);
                alert(t("placesPanel.messages.createSuccess"));
            }

            closeModal();
        } catch (err: any) {
            alert(err.message || t("placesPanel.messages.saveError"));
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
        if (!window.confirm(t("placesPanel.messages.confirmDelete"))) return;

        try {
            await deletePlace(id);
            setPlaces(places.filter(place => place._id !== id));
            alert(t("placesPanel.messages.deleteSuccess"));
        } catch (err: any) {
            alert(err.message || t("placesPanel.messages.deleteError"));
        }
    };

    const getTypeLabel = (type: string) => t(`placesPanel.types.${type}`, type);

    const filteredPlaces = places.filter(place =>
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTypeLabel(place.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (place.building || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-container">
            <div className="table-header">
                <h2>{t("placesPanel.title", { count: places.length })}</h2>
                {isAdmin && (
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + {t("placesPanel.addBtn")}
                    </button>
                )}
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <input
                    type="text"
                    placeholder={t("placesPanel.searchPlaceholder")}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ padding: "8px", flex: "1 1 200px" }}
                />
            </div>

            <table className="staff-table">
                <thead>
                    <tr>
                        <th>{t("placesPanel.columns.name")}</th>
                        <th>{t("placesPanel.columns.type")}</th>
                        <th>{t("placesPanel.columns.capacity")}</th>
                        <th>{t("placesPanel.columns.building")}</th>
                        <th>{t("placesPanel.columns.floor")}</th>
                        <th>{t("placesPanel.columns.status")}</th>
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
                                <span className={`badge badge-${place.type === "hall" ? "success" : place.type === "lecture_hall" ? "info" : place.type === "lab" ? "primary" : "warning"}`}>
                                    {getTypeLabel(place.type)}
                                </span>
                            </td>
                            <td>{place.capacity}</td>
                            <td>{place.building || "-"}</td>
                            <td>{place.floor !== undefined ? place.floor : "-"}</td>
                            <td>
                                <span className={`badge badge-${place.isActive ? "success" : "danger"}`}>
                                    {place.isActive ? t("placesPanel.status.active") : t("placesPanel.status.inactive")}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {filteredPlaces.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ textAlign: "center" }}>
                                {t("placesPanel.empty")}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {isAdmin && showModal && (
                <div
                    className="modal-overlay"
                    onMouseDown={e => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <div className="modal-content" style={{ maxWidth: "600px" }}>
                        <div className="modal-header">
                            <h3>{editingId ? t("placesPanel.modal.editTitle") : t("placesPanel.modal.addTitle")}</h3>
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
                                                if (editingId && window.confirm(t("placesPanel.messages.confirmDelete"))) {
                                                    handleDelete(editingId);
                                                    closeModal();
                                                }
                                            }}
                                        >
                                            {t("placesPanel.buttons.delete")}
                                        </button>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>{t("placesPanel.form.nameLabel")} *</label>
                                    <input
                                        type="text"
                                        placeholder={t("placesPanel.placeholders.name")}
                                        value={formName}
                                        onChange={e => {
                                            setFormName(e.target.value);
                                            setFormErrors(errors => ({ ...errors, formName: "" }));
                                        }}
                                    />
                                    {formErrors.formName && <span className="error">{formErrors.formName}</span>}
                                </div>

                                <div className="settings-form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>{t("placesPanel.form.typeLabel")} *</label>
                                        <select value={formType} onChange={e => setFormType(e.target.value as typeof formType)}>
                                            <option value="lecture_hall">{t("placesPanel.types.lecture_hall")}</option>
                                            <option value="hall">{t("placesPanel.types.hall")}</option>
                                            <option value="room">{t("placesPanel.types.room")}</option>
                                            <option value="lab">{t("placesPanel.types.lab")}</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>{t("placesPanel.form.capacityLabel")} *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder={t("placesPanel.placeholders.capacity")}
                                            value={formCapacity}
                                            onChange={e => {
                                                setFormCapacity(e.target.value);
                                                setFormErrors(errors => ({ ...errors, formCapacity: "" }));
                                            }}
                                        />
                                        {formErrors.formCapacity && <span className="error">{formErrors.formCapacity}</span>}
                                    </div>
                                </div>

                                <div className="settings-form-row">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>{t("placesPanel.form.buildingLabel")}</label>
                                        <input
                                            type="text"
                                            placeholder={t("placesPanel.placeholders.building")}
                                            value={formBuilding}
                                            onChange={e => setFormBuilding(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>{t("placesPanel.form.floorLabel")}</label>
                                        <input
                                            type="number"
                                            placeholder={t("placesPanel.placeholders.floor")}
                                            value={formFloor}
                                            onChange={e => setFormFloor(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <label
                                    className="settings-level-option"
                                    style={{ marginTop: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formIsActive}
                                        onChange={e => setFormIsActive(e.target.checked)}
                                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                    />
                                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text)" }}>
                                        {t("placesPanel.form.activeLabel")}
                                    </span>
                                </label>

                                <div className="modal-footer">
                                    <button type="button" className="cancel-btn" onClick={closeModal}>
                                        {t("placesPanel.buttons.cancel")}
                                    </button>
                                    <button type="submit" className="submit-btn" disabled={submitting}>
                                        {submitting
                                            ? t("placesPanel.buttons.saving")
                                            : editingId
                                                ? t("placesPanel.buttons.update")
                                                : t("placesPanel.buttons.save")}
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
