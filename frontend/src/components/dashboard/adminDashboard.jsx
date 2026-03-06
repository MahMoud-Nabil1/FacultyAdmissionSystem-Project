import React from "react";
import StudentPanel from "./studentPanel.tsx";
import StaffPanel from "./staffPanel.tsx";
import SubjectPanel from "./SubjectPanel";
import AnnouncementsPanel from "./createAnnouncementsPanel.tsx";
import "./css/adminDashboard.css";

const AdminDashboard = () => {
    return (
        <div className="dashboard-grid">
            <StaffPanel />
            <StudentPanel />
            <SubjectPanel />
            <AnnouncementsPanel />
        </div>
    );
};

export default AdminDashboard;