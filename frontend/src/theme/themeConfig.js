/**
 * Central theme configuration.
 * Token keys match CSS custom property names (without --).
 * Custom theme: no fixed colors; user values stored in localStorage and applied via JS.
 */
export const THEME_STORAGE_KEY = "app-theme-id";
export const CUSTOM_TOKENS_STORAGE_KEY = "app-theme-custom-tokens";

export const DEFAULT_THEME_ID = "light";
export const CUSTOM_THEME_ID = "custom";

export const THEMES = [
    { id: "light", name: "فاتح (Light)", description: "مظهر فاتح افتراضي." },
    { id: "dark", name: "داكن (Dark)", description: "مظهر داكن." },
    { id: CUSTOM_THEME_ID, name: "مخصص (Custom)", description: "اختر ألوانك بنفسك بدون ألوان ثابتة." },
];

/**
 * Tokens that can be customized. key = CSS var name without --.
 * type: 'color' | 'text' (text for shadows/radius that stay as text).
 */
export const CUSTOMIZABLE_TOKENS = [
    { key: "primary", labelAr: "اللون الأساسي", labelEn: "Primary", type: "color", default: "#004a99" },
    { key: "primary-hover", labelAr: "اللون الأساسي (تمرير)", labelEn: "Primary hover", type: "color", default: "#003d80" },
    { key: "sidebar-bg", labelAr: "خلفية الشريط الجانبي", labelEn: "Sidebar background", type: "color", default: "#1a2a4b" },
    { key: "sidebar-active", labelAr: "العنصر النشط", labelEn: "Sidebar active", type: "color", default: "#4a7afe" },
    { key: "success", labelAr: "النجاح", labelEn: "Success", type: "color", default: "#28a745" },
    { key: "error", labelAr: "الخطأ", labelEn: "Error", type: "color", default: "#dc3545" },
    { key: "warning", labelAr: "تحذير", labelEn: "Warning", type: "color", default: "#ffc107" },
    { key: "bg-light", labelAr: "خلفية فاتحة", labelEn: "Background light", type: "color", default: "#f5f7fa" },
    { key: "surface", labelAr: "خلفية السطح", labelEn: "Surface", type: "color", default: "#ffffff" },
    { key: "text-primary", labelAr: "النص الرئيسي", labelEn: "Text primary", type: "color", default: "#1a202c" },
    { key: "text-muted", labelAr: "النص الثانوي", labelEn: "Text muted", type: "color", default: "#6b7280" },
    { key: "border", labelAr: "الحدود", labelEn: "Border", type: "color", default: "#e2e8f0" },
    { key: "shadow-sm", labelAr: "ظل خفيف", labelEn: "Shadow small", type: "text", default: "0 1px 3px rgba(0,0,0,0.08)" },
    { key: "shadow-md", labelAr: "ظل متوسط", labelEn: "Shadow medium", type: "text", default: "0 4px 12px rgba(0,0,0,0.08)" },
    { key: "radius", labelAr: "نصف قطر الزوايا", labelEn: "Border radius", type: "text", default: "12px" },
    { key: "radius-sm", labelAr: "نصف قطر صغير", labelEn: "Radius small", type: "text", default: "8px" },
];

export function getThemeById(id) {
    return THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === DEFAULT_THEME_ID);
}

export function getDefaultCustomTokens() {
    return CUSTOMIZABLE_TOKENS.reduce((acc, t) => {
        acc[t.key] = t.default;
        return acc;
    }, {});
}

export function readStoredCustomTokens() {
    try {
        const raw = localStorage.getItem(CUSTOM_TOKENS_STORAGE_KEY);
        if (!raw) return getDefaultCustomTokens();
        const parsed = JSON.parse(raw);
        const defaults = getDefaultCustomTokens();
        return { ...defaults, ...parsed };
    } catch {
        return getDefaultCustomTokens();
    }
}
