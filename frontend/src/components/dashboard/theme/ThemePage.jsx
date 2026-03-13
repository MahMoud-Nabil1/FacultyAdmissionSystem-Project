import React, { useContext } from "react";
import { ThemeContext } from "../../../context/ThemeContext";

export default function ThemePage() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div style={{ padding: 16 }}>
      <h2>Theme</h2>
      <p>Current: <strong>{theme}</strong></p>
      <button type="button" onClick={toggleTheme}>
        Toggle theme
      </button>
    </div>
  );
}
