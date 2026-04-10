import React, { useContext } from "react";
import { AdminDashboardContext } from "./AdminDashboardLayout";
import { useAuth } from "../../context/AuthContext";
import WithDrawlPanel from "./panels/withDrawlPanel.tsx";
import AnnouncementsPanel from "./panels/createAnnouncementsPanel.tsx";
import RegistrationControlPanel from "./panels/RegistrationControlPanel.tsx";
import SettingsPanel from "./panels/settingsPanel.tsx";
import "./css/adminDashboard.css";
import { useTranslation } from "react-i18next";
import ReporterPanel from "./panels/reporterPanel.tsx";

const AdminDashboard = () => {
    const { userName, userRole } = useContext(AdminDashboardContext);
    const { user } = useAuth(); // Also get from auth to be safe
    const { t } = useTranslation();

    // Use role from auth context (more reliable) or fallback to context
    const role = user?.role || userRole;
    const isAdmin = role === "admin";
    const isReporter = role === "reporter";

    return (
        <>
            <h1 className="eduadmin-page-title">
                {t("adminDashboard.welcome", { name: userName || user?.name || "Admin" })}
            </h1>
            <div className="dashboard-grid">
                <div className="dashboard-column">
                    <SettingsPanel />
                    <AnnouncementsPanel />
                </div>

                {isAdmin && (
                    <div className="dashboard-column">
                        <RegistrationControlPanel />
                        <WithDrawlPanel />
                    </div>
                )}                                                       
                {/* reporter بس */}
            {isReporter && (
                <div className="dashboard-column">
                    <ReporterPanel />
                </div>  
                  )}
            </div>
        </>
    );
};

export default AdminDashboard;