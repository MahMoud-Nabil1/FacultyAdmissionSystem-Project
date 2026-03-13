import React from "react";
import { useTranslation } from "react-i18next";

const GroupPanel: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            minHeight: "200px"
        }}>
            <h1 style={{
                margin: "0 0 20px 0",
                fontSize: "24px",
                fontWeight: "600",
                color: "#333"
            }}>
                {t("groupPanel.title")}
            </h1>
        </div>
    );
};

export default GroupPanel;