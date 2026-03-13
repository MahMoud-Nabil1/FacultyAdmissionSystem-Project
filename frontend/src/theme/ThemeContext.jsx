import React, { createContext, useContext, useCallback, useState } from "react";
import {
    THEME_STORAGE_KEY,
    CUSTOM_TOKENS_STORAGE_KEY,
    CUSTOM_THEME_ID,
    DEFAULT_THEME_ID,
    getThemeById,
    readStoredCustomTokens,
    CUSTOMIZABLE_TOKENS,
} from "./themeConfig";

const ThemeContext = createContext({
    themeId: DEFAULT_THEME_ID,
    setThemeId: () => {},
    theme: null,
    customTokens: {},
    setCustomTokens: () => {},
});

function applyCustomTokens(tokens) {
    if (typeof document === "undefined" || !document.documentElement) return;
    const root = document.documentElement;
    root.setAttribute("data-theme", CUSTOM_THEME_ID);
    Object.entries(tokens || {}).forEach(([key, value]) => {
        if (value != null && value !== "") root.style.setProperty(`--${key}`, value);
    });
    root.style.setProperty("--primary-blue", "var(--primary)");
    root.style.setProperty("--success-green", "var(--success)");
    root.style.setProperty("--error-red", "var(--error)");
    root.style.setProperty("--warning-orange", "var(--warning)");
    root.style.setProperty("--white", "var(--surface)");
    root.style.setProperty("--text-dark", "var(--text-primary)");
    root.style.setProperty("--border-color", "var(--border)");
    root.style.setProperty("--sidebar-blue", "var(--sidebar-bg)");
}

function clearCustomTokens() {
    if (typeof document === "undefined" || !document.documentElement) return;
    const root = document.documentElement;
    CUSTOMIZABLE_TOKENS.forEach((t) => root.style.removeProperty(`--${t.key}`));
    ["--primary-blue", "--success-green", "--error-red", "--warning-orange", "--white", "--text-dark", "--border-color", "--sidebar-blue"].forEach((k) => root.style.removeProperty(k));
}

function applyTheme(themeId, customTokens) {
    const id = getThemeById(themeId)?.id ?? DEFAULT_THEME_ID;
    if (typeof document === "undefined" || !document.documentElement) return id;
    if (id === CUSTOM_THEME_ID) {
        clearCustomTokens();
        const tokens = customTokens ?? readStoredCustomTokens();
        applyCustomTokens(tokens);
    } else {
        clearCustomTokens();
        document.documentElement.setAttribute("data-theme", id);
    }
    return id;
}

function readStoredTheme() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        const theme = getThemeById(stored);
        return theme ? theme.id : DEFAULT_THEME_ID;
    } catch {
        return DEFAULT_THEME_ID;
    }
}

export function ThemeProvider({ children }) {
    const [themeId, setThemeIdState] = useState(() => {
        const initial = readStoredTheme();
        applyTheme(initial);
        return initial;
    });
    const [customTokens, setCustomTokensState] = useState(readStoredCustomTokens);

    const setThemeId = useCallback((id) => {
        applyTheme(id, id === CUSTOM_THEME_ID ? readStoredCustomTokens() : null);
        setThemeIdState(id);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, id);
        } catch (e) {
            console.warn("Theme persistence failed", e);
        }
    }, []);

    const setCustomTokens = useCallback((next) => {
        const merged = typeof next === "function" ? next(readStoredCustomTokens()) : { ...readStoredCustomTokens(), ...next };
        try {
            localStorage.setItem(CUSTOM_TOKENS_STORAGE_KEY, JSON.stringify(merged));
        } catch (e) {
            console.warn("Custom tokens persistence failed", e);
        }
        setCustomTokensState(merged);
        if (themeId === CUSTOM_THEME_ID) applyCustomTokens(merged);
    }, [themeId]);

    const theme = getThemeById(themeId);

    return (
        <ThemeContext.Provider
            value={{
                themeId,
                setThemeId,
                theme,
                customTokens: themeId === CUSTOM_THEME_ID ? customTokens : readStoredCustomTokens(),
                setCustomTokens,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return ctx;
}
