import React, { useEffect, useState } from "react";
import StudentPanel from "./studentPanel.tsx";
import StaffPanel from "./staffPanel.tsx";
import SubjectPanel from "./SubjectPanel";
import AnnouncementsPanel from "./createAnnouncementsPanel.tsx";
import SettingsPanel from "./settingsPanel.tsx";
import GroupPanel from "./groupPanel.tsx";
import "./css/adminDashboard.css";


const AdminDashboard = () => {
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/auth/me", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (!res.ok) throw new Error("Unauthorized");
                const data = await res.json();
                setUserName(data.name);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUser();
    }, []);

    return (
        <div className="admin-dashboard-container">
            <header className="dashboard-header">
                <h1>مرحبًا {userName}</h1>
            </header>

            <div className="dashboard-grid">
                {/* Right Column */}
                <div className="dashboard-column">
                    <StaffPanel />
                    <SubjectPanel />
                    <AnnouncementsPanel />
                </div>

                {/* Left Column */}
                <div className="dashboard-column">
                    <StudentPanel />
                    <SettingsPanel />
                    <GroupPanel />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;