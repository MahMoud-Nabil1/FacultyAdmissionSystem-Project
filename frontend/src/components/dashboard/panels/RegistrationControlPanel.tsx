import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getSystemSettings, updateSystemSettings } from "../../../services/api";

const RegistrationControlPanel: React.FC = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState({ registrationOpen: true, withdrawalOpen: true });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSystemSettings();
                setSettings({
                    registrationOpen: data.registrationOpen,
                    withdrawalOpen: data.withdrawalOpen
                });
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleToggle = async (field: 'registrationOpen' | 'withdrawalOpen') => {
        setUpdating(true);
        try {
            const newSettings = { ...settings, [field]: !settings[field] };
            const updated = await updateSystemSettings(newSettings);
            setSettings({
                registrationOpen: updated.registrationOpen,
                withdrawalOpen: updated.withdrawalOpen
            });
        } catch (err) {
            console.error("Failed to update settings:", err);
            alert("Failed to update settings");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="dashboard-container">
            <h2>{t("adminDashboard.controlPanelTitle", "Registration Control Panel")}</h2>
            <div className="control-panel-grid" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                <div className="control-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <span>{t("adminDashboard.registrationStatus", "Registration Status")}: 
                        <strong style={{ marginLeft: '5px', color: settings.registrationOpen ? 'var(--success-color)' : 'var(--error-color)' }}>
                            {settings.registrationOpen ? t("adminDashboard.open", "Open") : t("adminDashboard.closed", "Closed")}
                        </strong>
                    </span>
                    <button 
                        className={`submit-btn ${settings.registrationOpen ? 'danger-btn' : ''}`}
                        onClick={() => handleToggle('registrationOpen')}
                        disabled={updating}
                        style={{ width: 'auto', padding: '5px 15px', margin: 0, backgroundColor: settings.registrationOpen ? '#dc3545' : '#28a745' }}
                    >
                        {settings.registrationOpen ? t("adminDashboard.closeRegistration", "Close") : t("adminDashboard.openRegistration", "Open")}
                    </button>
                </div>

                <div className="control-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <span>{t("adminDashboard.withdrawalStatus", "Withdrawal Status")}: 
                        <strong style={{ marginLeft: '5px', color: settings.withdrawalOpen ? 'var(--success-color)' : 'var(--error-color)' }}>
                            {settings.withdrawalOpen ? t("adminDashboard.open", "Open") : t("adminDashboard.closed", "Closed")}
                        </strong>
                    </span>
                    <button 
                        className={`submit-btn ${settings.withdrawalOpen ? 'danger-btn' : ''}`}
                        onClick={() => handleToggle('withdrawalOpen')}
                        disabled={updating}
                        style={{ width: 'auto', padding: '5px 15px', margin: 0, backgroundColor: settings.withdrawalOpen ? '#dc3545' : '#28a745' }}
                    >
                        {settings.withdrawalOpen ? t("adminDashboard.closeWithdrawal", "Close") : t("adminDashboard.openWithdrawal", "Open")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegistrationControlPanel;
