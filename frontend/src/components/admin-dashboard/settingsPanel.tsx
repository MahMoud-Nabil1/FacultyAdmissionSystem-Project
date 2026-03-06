import React, { useState, useEffect, FormEvent } from "react";

const API_URL = "http://localhost:5000/api";

interface GPASettings {
    gpaMin: number;
    gpaMax: number;
    level: string;
}

const SettingsPanel: React.FC = () => {
    const [settings, setSettings] = useState<GPASettings>({ gpaMin: 2.5, gpaMax: 5, level: "1" });
    const [error, setError] = useState<string | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(false);

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/announcements/settings`);
            if (!res.ok) throw new Error("فشل في جلب الإعدادات");
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
            setError("⚠️ الحد الأدنى أكبر من أو يساوي الحد الأقصى");
        } else if (gpaMin < 0 || gpaMin > 5 || gpaMax < 0 || gpaMax > 5) {
            setError("⚠️ القيم يجب أن تكون بين 0 و 5");
        } else {
            setError(null);
        }
    }, [settings]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (error) return;

        setSettingsLoading(true);
        try {
            const res = await fetch(`${API_URL}/announcements/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...settings, updatedBy: "Admin" }),
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
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
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
                    <select
                        value={settings.level}
                        onChange={(e) => setSettings({ ...settings, level: e.target.value })}
                    >
                        <option value="1">المستوى الأول</option>
                        <option value="2">المستوى الثاني</option>
                        <option value="3">المستوى الثالث</option>
                        <option value="4">المستوى الرابع</option>
                    </select>
                </div>
                <button className="submit-btn" disabled={settingsLoading || !!error}>
                    {settingsLoading ? "جاري الحفظ..." : "حفظ الإعدادات"}
                </button>
            </form>
        </div>
    );
};

export default SettingsPanel;