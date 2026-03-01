import React from "react";
import StudentPanel from "./studentPanel";
import StaffPanel from "./staffPanel.tsx";
import "./css/adminDashboard.css";

const AdminDashboard = () => {
    return (
        <div className="dashboard-grid">
            <StaffPanel />
            <StudentPanel />
        </div>
    );
};

export default AdminDashboard;