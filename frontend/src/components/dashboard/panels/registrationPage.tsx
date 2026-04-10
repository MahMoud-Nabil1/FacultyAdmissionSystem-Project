import React, { useState, useEffect, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { getSystemSettings, updateSystemSettings } from "../../../services/api";

const API_URL = "http://localhost:5000/api";
const token = sessionStorage.getItem("token");

const RegistrationPage: React.FC = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState({ registrationOpen: true, withdrawalOpen: true });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // GPA & Level settings
    const [gpaMin, setGpaMin] = useState(2.5);
    const [gpaMax, setGpaMax] = useState(5);
    const [selectedLevels, setSelectedLevels] = useState<string[]>(["1"]);
    const [gpaError, setGpaError] = useState<string | null>(null);
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await getSystemSettings();
                setSettings({
                    registrationOpen: data.registrationOpen,
                    withdrawalOpen: data.withdrawalOpen
                });
                setGpaMin(data.gpaMin ?? 2.5);
                setGpaMax(data.gpaMax ?? 5);
                setSelectedLevels(Array.isArray(data.level) ? data.level : [data.level || "1"]);
            } catch (err) {
                console.error("Failed to fetch settings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (gpaMin >= gpaMax) {
            setGpaError("Min GPA must be less than Max GPA");
        } else if (gpaMin < 0 || gpaMin > 5 || gpaMax < 0 || gpaMax > 5) {
            setGpaError("GPA must be between 0 and 5");
        } else {
            setGpaError(null);
        }
    }, [gpaMin, gpaMax]);

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

    const handleLevelToggle = (level: string) => {
        setSelectedLevels(prev => {
            if (prev.includes(level)) {
                if (prev.length === 1) return prev;
                return prev.filter(l => l !== level);
            } else {
                return [...prev, level].sort();
            }
        });
    };

    const handleSaveSettings = async (e: FormEvent) => {
        e.preventDefault();
        if (gpaError || selectedLevels.length === 0) return;
        setSavingSettings(true);
        try {
            await updateSystemSettings({
                gpaMin, gpaMax, level: selectedLevels,
                registrationOpen: settings.registrationOpen,
                withdrawalOpen: settings.withdrawalOpen
            });
            alert("Settings saved successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to save settings");
        } finally {
            setSavingSettings(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="dashboard-container">
            {/* Registration / Withdrawal Controls */}
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Registration Control</h2>
            <div className="control-panel-grid" style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                <div className="control-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <span>Registration Status:
                        <strong style={{ marginLeft: '8px', color: settings.registrationOpen ? 'var(--success-color)' : 'var(--error-color)' }}>
                            {settings.registrationOpen ? 'Open' : 'Closed'}
                        </strong>
                    </span>
                    <button
                        className="panel-btn"
                        onClick={() => handleToggle('registrationOpen')}
                        disabled={updating}
                        style={{ width: 'auto', padding: '10px 20px', margin: 0 }}
                    >
                        {settings.registrationOpen ? 'Close' : 'Open'}
                    </button>
                </div>

                <div className="control-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <span>Withdrawal Status:
                        <strong style={{ marginLeft: '8px', color: settings.withdrawalOpen ? 'var(--success-color)' : 'var(--error-color)' }}>
                            {settings.withdrawalOpen ? 'Open' : 'Closed'}
                        </strong>
                    </span>
                    <button
                        className="panel-btn"
                        onClick={() => handleToggle('withdrawalOpen')}
                        disabled={updating}
                        style={{ width: 'auto', padding: '10px 20px', margin: 0 }}
                    >
                        {settings.withdrawalOpen ? 'Close' : 'Open'}
                    </button>
                </div>
            </div>

            {/* GPA & Level Settings */}
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>GPA & Level Settings</h2>
            {gpaError && <p className="error">{gpaError}</p>}
            <form onSubmit={handleSaveSettings} className="form">
                <div className="form-group">
                    <label>GPA Range</label>
                    <div className="settings-form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Min</label>
                            <input type="number" step="0.1" min={0} max={5} value={gpaMin} onChange={(e) => setGpaMin(parseFloat(e.target.value))} />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Max</label>
                            <input type="number" step="0.1" min={0} max={5} value={gpaMax} onChange={(e) => setGpaMax(parseFloat(e.target.value))} />
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>Available Levels</label>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {["1", "2", "3", "4"].map(level => (
                            <label key={level} className="settings-level-option" style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                                padding: '10px 16px',
                                background: selectedLevels.includes(level) ? 'var(--color-primary)' : 'var(--color-bg)',
                                color: selectedLevels.includes(level) ? 'white' : 'var(--color-text)',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                border: '1px solid var(--color-border)',
                                transition: 'all 0.2s ease'
                            }}>
                                <input 
                                    type="checkbox" 
                                    checked={selectedLevels.includes(level)} 
                                    onChange={() => handleLevelToggle(level)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: 600 }}>Level {level}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <button className="panel-btn" disabled={savingSettings || !!gpaError || selectedLevels.length === 0} style={{ width: '100%' }}>
                    {savingSettings ? "Saving..." : "Save Settings"}
                </button>
            </form>
        </div>
    );
};

export default RegistrationPage;
