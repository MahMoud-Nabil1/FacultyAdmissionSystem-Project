import React, { useState, useEffect, FormEvent } from "react";
import { useTranslation } from "react-i18next";

const API_URL = "http://localhost:5000/api";

interface GPASettings {
    gpaMin: number;
    gpaMax: number;
    level: string;
}

const SettingsPanel: React.FC = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState<GPASettings>({ gpaMin: 2.5, gpaMax: 5, level: "1" });
    const [selectedLevels, setSelectedLevels] = useState<string[]>(["1"]);
    const [error, setError] = useState<string | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const token = localStorage.getItem("token");

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/announcements/settings`);
            if (!res.ok) throw new Error(t("settingsPanel.fetchError"));
            const data = await res.json();

            setSettings({
                gpaMin: Math.min(data.gpaMin, data.gpaMax),
                gpaMax: Math.max(data.gpaMin, data.gpaMax),
                level: data.level,
            });
            
            // Parse level as array if it contains commas, otherwise single value
            const levels = data.level.includes(',') 
                ? data.level.split(',').map((l: string) => l.trim())
                : [data.level];
            setSelectedLevels(levels);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        const { gpaMin, gpaMax } = settings;
        if (gpaMin >= gpaMax) {
            setError(t("settingsPanel.errorMinMax"));
        } else if (gpaMin < 0 || gpaMin > 5 || gpaMax < 0 || gpaMax > 5) {
            setError(t("settingsPanel.errorRange"));
        } else {
            setError(null);
        }
    }, [settings, t]);

    const handleLevelToggle = (level: string) => {
        setSelectedLevels(prev => {
            if (prev.includes(level)) {
                // Don't allow deselecting all levels
                if (prev.length === 1) return prev;
                return prev.filter(l => l !== level);
            } else {
                return [...prev, level].sort();
            }
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (error || selectedLevels.length === 0) return;

        setSettingsLoading(true);
        try {
            const levelString = selectedLevels.join(',');
            const res = await fetch(`${API_URL}/announcements/settings`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ ...settings }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.message || t("settingsPanel.saveError"));
                return;
            }

            alert(t("settingsPanel.saveSuccess"));
        } catch (err) {
            console.error(err);
            alert(t("settingsPanel.saveError"));
        } finally {
            setSettingsLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <h2>{t("settingsPanel.title")}</h2>
            {error && <p className="error">{error}</p>}

            <form className="form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>{t("settingsPanel.gpaRangeLabel")}</label>
                    <div className="settings-form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>{t("settingsPanel.minLabel")}</label>
                            <input
                                type="number"
                                step="0.1"
                                min={0}
                                max={5}
                                placeholder={t("settingsPanel.minPlaceholder")}
                                value={settings.gpaMin}
                                onChange={(e) => setSettings({ ...settings, gpaMin: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>{t("settingsPanel.maxLabel")}</label>
                            <input
                                type="number"
                                step="0.1"
                                min={0}
                                max={5}
                                placeholder={t("settingsPanel.maxPlaceholder")}
                                value={settings.gpaMax}
                                onChange={(e) => setSettings({ ...settings, gpaMax: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <label>{t("announcements.levelSectionTitle")}</label>
                    <div className="settings-level-row">
                        {["1", "2", "3", "4"].map(level => (
                            <label key={level} className="settings-level-option">
                                <input
                                    type="checkbox"
                                    checked={selectedLevels.includes(level)}
                                    onChange={() => handleLevelToggle(level)}
                                />
                                <span className="settings-level-label">
                                    {t(`announcements.level${level}`)}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <button className="submit-btn" disabled={settingsLoading || !!error || selectedLevels.length === 0}>
                    {settingsLoading ? t("settingsPanel.savingBtn") : t("settingsPanel.saveBtn")}
                </button>
            </form>
        </div>
    );
};

export default SettingsPanel;