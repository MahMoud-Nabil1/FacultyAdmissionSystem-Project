import React from "react";
import { useTheme } from "../../../theme/ThemeContext";
import { THEMES, CUSTOMIZABLE_TOKENS, getDefaultCustomTokens } from "../../../theme/themeConfig";

export default function ThemePage() {
    const { themeId, setThemeId, customTokens, setCustomTokens } = useTheme();

    const handleTokenChange = (key, value) => {
        setCustomTokens({ [key]: value });
    };

    const handleResetCustom = () => {
        setCustomTokens(getDefaultCustomTokens());
    };

    return (
        <div className="dashboard-container theme-page">
            <h1 className="eduadmin-page-title">المظهر (Theme)</h1>
            <p className="theme-page-description">
                اختر مظهر الموقع أو مخصص بدون ألوان ثابتة — يمكنك تغيير كل لون كما تريد.
            </p>
            <div className="theme-page-grid">
                {THEMES.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        className={`theme-page-card ${themeId === t.id ? "active" : ""}`}
                        onClick={() => setThemeId(t.id)}
                    >
                        <span className="theme-page-card-name">{t.name}</span>
                        {t.description && (
                            <span className="theme-page-card-desc">{t.description}</span>
                        )}
                        {themeId === t.id && (
                            <span className="theme-page-card-badge">مفعّل</span>
                        )}
                    </button>
                ))}
            </div>

            {themeId === "custom" && (
                <section className="theme-custom-section">
                    <h2 className="theme-custom-title">تخصيص الألوان والقيم</h2>
                    <p className="theme-custom-hint">لا توجد ألوان ثابتة — غيّر أي قيمة وستُطبّق فوراً.</p>
                    <div className="theme-custom-grid">
                        {CUSTOMIZABLE_TOKENS.map((token) => (
                            <div key={token.key} className="theme-custom-item">
                                <label className="theme-custom-label" htmlFor={`token-${token.key}`}>
                                    {token.labelAr}
                                </label>
                                {token.type === "color" ? (
                                    <div className="theme-custom-color-wrap">
                                        <input
                                            id={`token-${token.key}`}
                                            type="color"
                                            value={customTokens[token.key] || token.default}
                                            onChange={(e) => handleTokenChange(token.key, e.target.value)}
                                            className="theme-custom-color"
                                        />
                                        <input
                                            type="text"
                                            value={customTokens[token.key] || token.default}
                                            onChange={(e) => handleTokenChange(token.key, e.target.value)}
                                            className="theme-custom-hex"
                                            placeholder={token.default}
                                        />
                                    </div>
                                ) : (
                                    <input
                                        id={`token-${token.key}`}
                                        type="text"
                                        value={customTokens[token.key] ?? token.default}
                                        onChange={(e) => handleTokenChange(token.key, e.target.value)}
                                        className="theme-custom-text"
                                        placeholder={token.default}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <button type="button" className="theme-custom-reset" onClick={handleResetCustom}>
                        إعادة التعيين إلى القيم الافتراضية
                    </button>
                </section>
            )}
        </div>
    );
}
