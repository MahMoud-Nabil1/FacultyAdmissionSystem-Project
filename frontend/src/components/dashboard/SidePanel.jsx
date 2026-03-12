import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./css/adminDashboard.css";

const SidePanel = ({ userName = "", onSignOut }) => {
    const location = useLocation();

    const isActive = (path) =>
        location.pathname === path || location.pathname.startsWith(path + "/");
    const isTable = (type) =>
        location.pathname.includes("/table") &&
        new URLSearchParams(location.search).get("type") === type;

    return (
        <aside className="eduadmin-sidebar">
            <div className="eduadmin-sidebar-logo">
                <img src="/logo.png" alt="Faculty of Science" className="eduadmin-logo-img" />
            </div>
            <nav className="eduadmin-nav">
                <Link
                    to="/admin-dashboard"
                    className={`eduadmin-nav-item ${isActive("/admin-dashboard") && !location.pathname.includes("/table") ? "active" : ""}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span>Dashboard</span>
                </Link>
                <Link
                    to="/admin-dashboard/table?type=students"
                    className={`eduadmin-nav-item ${isTable("students") ? "active" : ""}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>StudentPanel</span>
                </Link>
                <Link
                    to="/admin-dashboard/table?type=staff"
                    className={`eduadmin-nav-item ${isTable("staff") ? "active" : ""}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>StaffPanel</span>
                </Link>
                <Link
                    to="/admin-dashboard/table?type=subjects"
                    className={`eduadmin-nav-item ${isTable("subjects") ? "active" : ""}`}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span>Subjects</span>
                </Link>
                <Link to="/admin-dashboard" className="eduadmin-nav-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Settings</span>
                </Link>
            </nav>
            <div className="eduadmin-sidebar-footer">
                <button type="button" className="eduadmin-btn-signout" onClick={onSignOut}>
                    Sign out
                </button>
                <div className="eduadmin-sidebar-user">
                    <div className="eduadmin-user-avatar">
                        {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="eduadmin-user-info">
                        <span className="eduadmin-user-name">{userName || "User"}</span>
                        <span className="eduadmin-user-role">Dean of Admissions</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default SidePanel;
