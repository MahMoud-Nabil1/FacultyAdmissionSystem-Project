import React, { useContext } from "react";
import { AdminDashboardContext } from "./AdminDashboardLayout";
import StudentPanel from "./studentPanel.tsx";
import StaffPanel from "./staffPanel.tsx";
import SubjectPanel from "./SubjectPanel";
import AnnouncementsPanel from "./createAnnouncementsPanel.tsx";
import SettingsPanel from "./settingsPanel.tsx";
import GroupPanel from "./groupPanel.tsx";

const AdminDashboard = () => {
    const { userName } = useContext(AdminDashboardContext);

    return (
        <>
            <h1 className="eduadmin-page-title">Admissions Overview</h1>
            <p className="eduadmin-welcome">
                Welcome back, {userName || "Sarah"}. Here&apos;s what&apos;s happening today.
            </p>
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
