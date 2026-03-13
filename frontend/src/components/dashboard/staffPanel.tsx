import React, {ChangeEvent, FormEvent, useState} from "react";
import {createStaff} from "../../services/api";
import {useNavigate} from "react-router-dom";
import {ROLES} from "../../services/constants";
import { useTranslation } from "react-i18next";

interface StaffForm {
    name: string;
    email: string;
    role: keyof typeof ROLES;
    password: string;
}

const StaffPanel: React.FC = () => {
    const { t } = useTranslation();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<StaffForm>({
        name: "",
        email: "",
        role: "admin",
        password: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const {name, value} = e.target;
        setForm((prev) => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await createStaff(form);
            setForm({name: "", email: "", role: "admin", password: ""});
            setShowForm(false);
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

    return (
        <div className="dashboard-container">
            <h2>{t("staffPanel.title")}</h2>

            {/* Buttons */}
            <div style={{display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "20px"}}>
                <button
                    className="panel-btn"
                    onClick={() => setShowForm((prev) => !prev)}
                >
                    {showForm ? t("staffPanel.cancelBtn") : t("staffPanel.addBtn")}
                </button>

                <button
                    className="panel-btn"
                    onClick={() => navigate("/admin-dashboard/table?type=staff")}
                >
                    {t("staffPanel.viewAllBtn")}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form className="form" onSubmit={handleSubmit}>
                    {error && <p className="error">{error}</p>}

                    <div className="form-group">
                        <label>{t("staffPanel.nameLabel")}</label>
                        <input
                            name="name"
                            placeholder={t("staffPanel.namePlaceholder")}
                            value={form.name}
                            onChange={handleChange}
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
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>{t("staffPanel.roleLabel")}</label>
                        <select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
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
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button className="submit-btn" disabled={loading}>
                        {loading ? t("staffPanel.loadingBtn") : t("staffPanel.submitBtn")}
                    </button>
                </form>
            )}
        </div>
    );
};

export default StaffPanel;