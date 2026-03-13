/**
 * Theme module public API.
 * Use: import { ThemeProvider, useTheme, THEMES } from '../theme';
 */
export { ThemeProvider, useTheme } from "./ThemeContext";
export {
    THEMES,
    DEFAULT_THEME_ID,
    THEME_STORAGE_KEY,
    getThemeById,
} from "./themeConfig";
