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
            <h2>{t("settingsPanel.controlPanelTitle")}</h2>
            <div className="control-panel-grid" style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                <div className="control-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <span>{t("settingsPanel.registrationStatus")}: 
                        <strong style={{ marginLeft: '5px', color: settings.registrationOpen ? 'var(--success-color)' : 'var(--error-color)' }}>
                            {settings.registrationOpen ? t("settingsPanel.open") : t("settingsPanel.closed")}
                        </strong>
                    </span>
                    <button 
                        className={`submit-btn ${settings.registrationOpen ? 'danger-btn' : ''}`}
                        onClick={() => handleToggle('registrationOpen')}
                        disabled={updating}
                        style={{ width: 'auto', padding: '5px 15px', margin: 0, backgroundColor: settings.registrationOpen ? '#dc3545' : '#28a745' }}
                    >
                        {settings.registrationOpen ? t("settingsPanel.closeRegistration") : t("settingsPanel.openRegistration")}
                    </button>
                </div>

                <div className="control-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <span>{t("settingsPanel.withdrawalStatus")}: 
                        <strong style={{ marginLeft: '5px', color: settings.withdrawalOpen ? 'var(--success-color)' : 'var(--error-color)' }}>
                            {settings.withdrawalOpen ? t("settingsPanel.open") : t("settingsPanel.closed")}
                        </strong>
                    </span>
                    <button 
                        className={`submit-btn ${settings.withdrawalOpen ? 'danger-btn' : ''}`}
                        onClick={() => handleToggle('withdrawalOpen')}
                        disabled={updating}
                        style={{ width: 'auto', padding: '5px 15px', margin: 0, backgroundColor: settings.withdrawalOpen ? '#dc3545' : '#28a745' }}
                    >
                        {settings.withdrawalOpen ? t("settingsPanel.closeWithdrawal") : t("settingsPanel.openWithdrawal")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegistrationControlPanel;
