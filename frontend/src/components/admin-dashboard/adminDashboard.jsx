import React from "react";
import StudentPanel from "./studentPanel";
import StaffPanel from "./staffPanel";
import SubjectPanel from "./SubjectPanel";
import "./css/adminDashboard.css";

const AdminDashboard = () => {
    return (
        <div className="dashboard-grid">
            <StaffPanel />
            <StudentPanel />
            <SubjectPanel />
        </div>
    );
};

export default AdminDashboard;