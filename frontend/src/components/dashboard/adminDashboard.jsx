import React, { useContext } from "react";
import { AdminDashboardContext } from "./AdminDashboardLayout";
import AnnouncementsPanel from "./panels/createAnnouncementsPanel.tsx";
import RegistrationControlPanel from "./panels/RegistrationControlPanel.tsx";
import SettingsPanel from "./panels/settingsPanel.tsx";
import "./css/adminDashboard.css";
import { useTranslation } from "react-i18next";

const AdminDashboard = () => {
    const { userName } = useContext(AdminDashboardContext);
    const { t } = useTranslation();

    return (
        <>
            <h1 className="eduadmin-page-title">{t("adminDashboard.welcome", { name: userName || "Admin" })}</h1>
            <div className="dashboard-grid">
                <div className="dashboard-column">
                    <RegistrationControlPanel />
                    <AnnouncementsPanel />
                </div>
                <div className="dashboard-column">
                    <SettingsPanel />
                </div>
            </div>
        </>
    );
};

export default AdminDashboard;
