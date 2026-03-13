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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (error) return;

        setSettingsLoading(true);
        try {
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
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={5}
                        placeholder={t("settingsPanel.minPlaceholder")}
                        value={settings.gpaMin}
                        onChange={(e) => setSettings({ ...settings, gpaMin: parseFloat(e.target.value) })}
                    />
                    <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={5}
                        placeholder={t("settingsPanel.maxPlaceholder")}
                        value={settings.gpaMax}
                        onChange={(e) => setSettings({ ...settings, gpaMax: parseFloat(e.target.value) })}
                    />
                    <select
                        value={settings.level}
                        onChange={(e) => setSettings({ ...settings, level: e.target.value })}
                    >
                        <option value="1">{t("announcements.level1")}</option>
                        <option value="2">{t("announcements.level2")}</option>
                        <option value="3">{t("announcements.level3")}</option>
                        <option value="4">{t("announcements.level4")}</option>
                    </select>
                </div>
                <button className="submit-btn" disabled={settingsLoading || !!error}>
                    {settingsLoading ? t("settingsPanel.savingBtn") : t("settingsPanel.saveBtn")}
                </button>
            </form>
        </div>
    );
};

export default SettingsPanel;