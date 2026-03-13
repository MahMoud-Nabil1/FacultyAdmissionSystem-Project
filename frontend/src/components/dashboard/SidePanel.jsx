import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./css/adminDashboard.css";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

const SidePanel = ({ userName = "", onSignOut }) => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
        } catch {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "true" : "false");
        } catch (e) {
            console.warn("Sidebar preference not persisted", e);
        }
    }, [collapsed]);

    const toggleCollapsed = () => setCollapsed((c) => !c);

    const isActive = (path) =>
        location.pathname === path || location.pathname.startsWith(path + "/");
    const isTable = (type) =>
        location.pathname.includes("/table") &&
        new URLSearchParams(location.search).get("type") === type;

    return (
        <aside className={`eduadmin-sidebar ${collapsed ? "collapsed" : ""}`}>
            <div className="eduadmin-sidebar-header">
                <div className="eduadmin-sidebar-logo">
                    <img src="/logo.png" alt="Faculty of Science" className="eduadmin-logo-img" />
                </div>
                <button
                    type="button"
                    className="eduadmin-sidebar-toggle"
                    onClick={toggleCollapsed}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    )}
                </button>
            </div>
            <nav className="eduadmin-nav">
                <Link
                    to="/admin-dashboard"
                    className={`eduadmin-nav-item ${isActive("/admin-dashboard") && !location.pathname.includes("/table") && !location.pathname.includes("/theme") ? "active" : ""}`}
                    title="Dashboard"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className="eduadmin-nav-label">Dashboard</span>
                </Link>
                <Link
                    to="/admin-dashboard/table?type=students"
                    className={`eduadmin-nav-item ${isTable("students") ? "active" : ""}`}
                    title="StudentPanel"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="eduadmin-nav-label">StudentPanel</span>
                </Link>
                <Link
                    to="/admin-dashboard/table?type=staff"
                    className={`eduadmin-nav-item ${isTable("staff") ? "active" : ""}`}
                    title="StaffPanel"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="eduadmin-nav-label">StaffPanel</span>
                </Link>
                <Link
                    to="/admin-dashboard/table?type=subjects"
                    className={`eduadmin-nav-item ${isTable("subjects") ? "active" : ""}`}
                    title="Subjects"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span className="eduadmin-nav-label">Subjects</span>
                </Link>
                <Link
                    to="/admin-dashboard/theme"
                    className={`eduadmin-nav-item ${location.pathname.includes("/theme") ? "active" : ""}`}
                    title="Theme"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    <span className="eduadmin-nav-label">Theme</span>
                </Link>
            </nav>
            <div className="eduadmin-sidebar-footer">
                <button type="button" className="eduadmin-btn-signout" onClick={onSignOut} title="Sign out">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="eduadmin-nav-label">Sign out</span>
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
