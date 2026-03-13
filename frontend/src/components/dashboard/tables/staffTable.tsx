import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllStaff, deleteStaff, createStaff } from "../../../services/api";
import { ROLES } from "../../../services/constants";
import Pagination from "../pagination";
import { PAGE_SIZE } from "../../../services/constants";
import { useTranslation } from "react-i18next";

interface Staff {
    _id: string;
    name: string;
    email: string;
    role: keyof typeof ROLES;
}

interface StaffForm {
    name: string;
    email: string;
    role: keyof typeof ROLES;
    password: string;
}

export const StaffTable: React.FC = () => {
    const { t } = useTranslation();
    const [staff, setStaff] = useState<Staff[]>([]);
    const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchId, setSearchId] = useState("");
    const [filterRole, setFilterRole] = useState<keyof typeof ROLES | "all">("all");
    const [page, setPage] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<StaffForm>({
        name: "",
        email: "",
        role: "admin",
        password: "",
    });
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const loadStaff = async () => {
        try {
            const data = await getAllStaff();
            setStaff(data);
        } catch {
            setError(t("staffPanel.errorGeneric"));
        }
    };

    useEffect(() => {
        // Apply filtering by role and searchId
        let temp = [...staff];

        if (filterRole !== "all") {
            temp = temp.filter((s) => s.role === filterRole);
        }

        if (searchId.trim() !== "") {
            temp = temp.filter((s) => s._id.includes(searchId.trim()));
        }

        setFilteredStaff(temp);
        setPage(0); // Reset to first page when filtering
    }, [staff, searchId, filterRole]);

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm(t("dashboardCommon.confirmDeleteStaff"))) return;
        try {
            await deleteStaff(id);
            setStaff((prev) => prev.filter((x) => x._id !== id));
        } catch {
            setError(t("staffPanel.errorGeneric"));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await createStaff(form);
            setForm({ name: "", email: "", role: "admin", password: "" });
            setShowModal(false);
            await loadStaff(); // Reload the list
        } catch (err: any) {
            if (err.status === 409) {
                setError(t("staffPanel.errorDuplicate"));
            } else {
                setError(err.message || t("staffPanel.errorGeneric"));
            }
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setForm({ name: "", email: "", role: "admin", password: "" });
        setError(null);
    };

    useEffect(() => {
        loadStaff();
    }, []);

    // Pagination slice
    const pagedStaff = filteredStaff.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div className="dashboard-container">
            <div className="table-header">
                <h2>{t("staffTable.title")}</h2>
                <button className="add-btn" onClick={() => setShowModal(true)}>
                    + {t("staffTable.addNew")}
                </button>
            </div>
            {error && <p className="error">{error}</p>}

            {/* Top filter/search bar */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <input
                    type="text"
                    placeholder={t("dashboardCommon.searchById")}
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    style={{ padding: "8px", flex: "1 1 200px" }}
                />
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as keyof typeof ROLES | "all")}
                    style={{ padding: "8px", flex: "0 0 150px" }}
                >
                    <option value="all">{t("dashboardCommon.all")}</option>
                    {Object.entries(ROLES).map(([v, l]) => (
                        <option key={v} value={v}>
                            {t(l)}
                        </option>
                    ))}
                </select>
            </div>

            <table className="staff-table">
                <thead>
                <tr>
                    <th>{t("staffTable.name")}</th>
                    <th>{t("staffTable.email")}</th>
                    <th>{t("staffTable.role")}</th>
                    <th>{t("staffTable.copyId")}</th>
                    <th>{t("dashboardCommon.delete")}</th>
                </tr>
                </thead>
                <tbody>
                {pagedStaff.map((s) => (
                    <tr key={s._id}>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{t(ROLES[s.role])}</td>
                        <td>
                            <button className="copy-btn" onClick={() => handleCopy(s._id)}>
                                {copiedId === s._id ? t("dashboardCommon.copied") : t("dashboardCommon.copy")}
                            </button>
                        </td>
                        <td>
                            <button className="delete-btn" onClick={() => handleDelete(s._id)}>
                                {t("dashboardCommon.delete")}
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Pagination */}
            <Pagination page={page} setPage={setPage} total={filteredStaff.length} />

            {/* Add Staff Modal */}
            {showModal && (
                <div className="modal-overlay" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closeModal();
                }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{t("staffTable.addNew")}</h3>
                            <button className="modal-close" onClick={closeModal} type="button">×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                {error && <p className="error">{error}</p>}

                                <div className="form-group">
                                    <label>{t("staffPanel.nameLabel")}</label>
                                    <input
                                        name="name"
                                        placeholder={t("staffPanel.namePlaceholder")}
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{t("staffPanel.emailLabel")}</label>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder={t("staffPanel.emailPlaceholder")}
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>{t("staffPanel.roleLabel")}</label>
                                    <select
                                        name="role"
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value as keyof typeof ROLES })}
                                        required
                                    >
                                        {Object.entries(ROLES).map(([v, l]) => (
                                            <option key={v} value={v}>
                                                {t(l)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>{t("staffPanel.passwordLabel")}</label>
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder={t("staffPanel.passwordPlaceholder")}
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="modal-footer">
                                    <button type="button" className="cancel-btn" onClick={closeModal}>
                                        {t("dashboardCommon.cancel")}
                                    </button>
                                    <button type="submit" className="submit-btn" disabled={loading}>
                                        {loading ? t("staffPanel.loadingBtn") : t("staffPanel.submitBtn")}
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