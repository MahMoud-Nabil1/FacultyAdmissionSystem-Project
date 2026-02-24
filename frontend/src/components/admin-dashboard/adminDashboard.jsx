import React from "react";
import StudentPanel from "./studentPanel";
import StaffPanel from "./staffPanel";
import "./adminDashboard.css";

const AdminDashboard = () => {
    return (
        <div className="dashboard-grid">
            <StaffPanel />
            <StudentPanel />
        </div>
    );
};

export default AdminDashboard;