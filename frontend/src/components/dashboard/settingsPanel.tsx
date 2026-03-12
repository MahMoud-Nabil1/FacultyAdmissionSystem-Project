import React, { useState, useEffect } from "react";

const API_URL = "http://localhost:5000/api";

interface GPASettings {
    gpaMin: number;
    gpaMax: number;
    level: string[];
}

const LEVEL_OPTIONS: { value: string; label: string }[] = [
    { value: "1", label: "المستوى الأول" },
    { value: "2", label: "المستوى الثاني" },
    { value: "3", label: "المستوى الثالث" },
    { value: "4", label: "المستوى الرابع" },
];

const SettingsPanel = () => {
    const [settings, setSettings] = useState({ gpaMin: 2.5, gpaMax: 5, level: ["1"] } as GPASettings);
    const [error, setError] = useState(null as string | null);
    const [settingsLoading, setSettingsLoading] = useState(false);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/announcements/settings`);
            if (!res.ok) throw new Error("فشل في جلب الإعدادات");
            const data = await res.json();

            setSettings({
                gpaMin: Math.min(data.gpaMin, data.gpaMax),
                gpaMax: Math.max(data.gpaMin, data.gpaMax),
                level: Array.isArray(data.level) ? data.level : (data.level ? [String(data.level)] : ["1"]),
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
            setError("⚠️ الحد الأدنى أكبر من أو يساوي الحد الأقصى");
        } else if (gpaMin < 0 || gpaMin > 5 || gpaMax < 0 || gpaMax > 5) {
            setError("⚠️ القيم يجب أن تكون بين 0 و 5");
        } else {
            setError(null);
        }
    }, [settings]);

    const toggleLevel = (value: string) => {
        setSettings((prev) => {
            const next = prev.level.includes(value)
                ? prev.level.filter((l) => l !== value)
                : [...prev.level, value];
            return { ...prev, level: next.length ? next : ["1"] };
        });
    };

    const handleSubmit = async (e: { preventDefault: () => void }) => {
        e.preventDefault();
        if (error) return;
        const payload = { ...settings, level: settings.level.length ? settings.level : ["1"], updatedBy: "Admin" };
        setSettingsLoading(true);
        try {
            const res = await fetch(`${API_URL}/announcements/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.message || "حدث خطأ");
                return;
            }

            alert("✅ تم حفظ الإعدادات بنجاح");
        } catch (err) {
            console.error(err);
            alert("❌ حدث خطأ في الاتصال");
        } finally {
            setSettingsLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <h2>إعدادات المعدل التراكمي والمستوى</h2>
            {error && <p className="error">{error}</p>}

            <form className="form" onSubmit={handleSubmit}>
                <div className="settings-form-row">
                    <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={5}
                        placeholder="الحد الأدنى للمعدل"
                        value={settings.gpaMin}
                        onChange={(e) => setSettings({ ...settings, gpaMin: parseFloat(e.target.value) })}
                    />
                    <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={5}
                        placeholder="الحد الأقصى للمعدل"
                        value={settings.gpaMax}
                        onChange={(e) => setSettings({ ...settings, gpaMax: parseFloat(e.target.value) })}
                    />
                    <div className="settings-level-row">
                        <span className="settings-level-label">المستوى:</span>
                        {LEVEL_OPTIONS.map((opt) => (
                            <label key={opt.value} className="settings-level-option">
                                <input
                                    type="checkbox"
                                    checked={settings.level.includes(opt.value)}
                                    onChange={() => toggleLevel(opt.value)}
                                />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>
                <button className="submit-btn" disabled={settingsLoading || !!error}>
                    {settingsLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
                </button>
            </form>
        </div>
    );
};

export default SettingsPanel;