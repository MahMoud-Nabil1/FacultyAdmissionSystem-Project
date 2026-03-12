import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import SidePanel from "./SidePanel";
import "./css/adminDashboard.css";

export const AdminDashboardContext = React.createContext({ userName: "" });

const AdminDashboardLayout = () => {
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
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

    const handleSignOut = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <AdminDashboardContext.Provider value={{ userName }}>
            <div className="eduadmin-layout">
                <SidePanel userName={userName} onSignOut={handleSignOut} />
                <div className="eduadmin-main">
                    <header className="eduadmin-topbar" />
                    <div className="eduadmin-content">
                        <Outlet />
                    </div>
                </div>
            </div>
        </AdminDashboardContext.Provider>
    );
};

export default AdminDashboardLayout;
