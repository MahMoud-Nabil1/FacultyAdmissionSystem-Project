import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { ThemeContext } from "../../../context/ThemeContext";

export default function ThemePage() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div style={{ padding: 16 }}>
      <h2>{t("themePage.title")}</h2>
      <p>{t("themePage.current")} <strong>{theme}</strong></p>
      <button type="button" onClick={toggleTheme}>
        {t("themePage.toggleButton")}
      </button>
    </div>
  );
}
