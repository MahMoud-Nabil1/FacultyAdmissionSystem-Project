import React, { useContext } from "react";
import { AdminDashboardContext } from "./AdminDashboardLayout";
import StudentPanel from "./studentPanel.tsx";
import StaffPanel from "./staffPanel.tsx";
import SubjectPanel from "./SubjectPanel";
import AnnouncementsPanel from "./createAnnouncementsPanel.tsx";
import SettingsPanel from "./settingsPanel.tsx";
import GroupPanel from "./groupPanel.tsx";
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
