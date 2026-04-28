import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import "../css/adminDashboard.css";

const SIDEBAR_COLLAPSED_KEY = "sidebar-collapsed";

const SidePanel = ({ userName = "", onSignOut }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
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

    // academic_guide can only see: Announcements, Students, Groups, Subjects, Places
    const isAcademicGuide = user?.role === "academic_guide";
    const isReporter = user?.role === "reporter";

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
                    title={collapsed ? t("sidePanel.expandSidebar") : t("sidePanel.collapseSidebar")}
                    aria-label={collapsed ? t("sidePanel.expandSidebar") : t("sidePanel.collapseSidebar")}
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
                    to="/admin-dashboard/announcements"
                    className={`eduadmin-nav-item ${location.pathname.includes("/announcements") ? "active" : ""}`}
                    title={t("sidePanel.announcements")}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span className="eduadmin-nav-label">{t("sidePanel.announcements")}</span>
                </Link>

                {/* Hide Registration for academic_guide and reporter */}
                {!(isAcademicGuide || isReporter) && (
                    <Link
                        to="/admin-dashboard/registration"
                        className={`eduadmin-nav-item ${location.pathname.includes("/registration") ? "active" : ""}`}
                        title={t("sidePanel.registration")}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span className="eduadmin-nav-label">{t("sidePanel.registration")}</span>
                    </Link>
                )}

                {/* Hide Academic Requests for academic_guide and reporter */}
                {!(isAcademicGuide || isReporter) && (
                    <Link
                        to="/admin-dashboard/requests"
                        className={`eduadmin-nav-item ${location.pathname.includes("/requests") ? "active" : ""}`}
                        title={t("sidePanel.academicRequests")}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                        <span className="eduadmin-nav-label">{t("sidePanel.academicRequests")}</span>
                    </Link>
                )}

                {!isReporter && (
                    <Link
                        to="/admin-dashboard/table?type=students"
                        className={`eduadmin-nav-item ${isTable("students") ? "active" : ""}`}
                        title={t("sidePanel.students")}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span className="eduadmin-nav-label">{t("sidePanel.students")}</span>
                    </Link>
                )}

                {/* Hide Staff for academic_guide and reporter */}
                {!(isAcademicGuide || isReporter) && (
                    <Link
                        to="/admin-dashboard/table?type=staff"
                        className={`eduadmin-nav-item ${isTable("staff") ? "active" : ""}`}
                        title={t("sidePanel.staff")}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span className="eduadmin-nav-label">{t("sidePanel.staff")}</span>
                    </Link>
                )}

                <Link
                    to="/admin-dashboard/table?type=subjects"
                    className={`eduadmin-nav-item ${isTable("subjects") ? "active" : ""}`}
                    title={t("sidePanel.subjects")}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span className="eduadmin-nav-label">{t("sidePanel.subjects")}</span>
                </Link>
                <Link
                    to="/admin-dashboard/groups"
                    className={`eduadmin-nav-item ${location.pathname.includes("/groups") ? "active" : ""}`}
                    title={t("sidePanel.groups")}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="eduadmin-nav-label">{t("sidePanel.groups")}</span>
                </Link>
                {!isReporter && (
                    <Link
                        to="/admin-dashboard/places"
                        className={`eduadmin-nav-item ${location.pathname.includes("/places") ? "active" : ""}`}
                        title={t("sidePanel.places")}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="eduadmin-nav-label">{t("sidePanel.places")}</span>
                    </Link>
                )}
            </nav>
            <div className="eduadmin-sidebar-footer">
                <button type="button" className="eduadmin-btn-home" onClick={() => navigate("/")} title={t("sidePanel.returnHome")}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className="eduadmin-nav-label">{t("sidePanel.returnHome")}</span>
                </button>
                <button type="button" className="eduadmin-btn-signout" onClick={onSignOut} title={t("sidePanel.signOut")}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="eduadmin-nav-label">{t("sidePanel.signOut")}</span>
                </button>
                <div className="eduadmin-sidebar-user">
                    <div className="eduadmin-user-avatar">
                        {user?.avatar ? (
                            <img 
                                src={user.avatar} 
                                alt="Avatar" 
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            userName ? userName.charAt(0).toUpperCase() : "U"
                        )}
                    </div>
                    <div className="eduadmin-user-info">
                        <span className="eduadmin-user-name">{userName || t("sidePanel.user")}</span>
                        <span className="eduadmin-user-role">{t(`sidePanel.${user?.role || "user"}Role`, { defaultValue: user?.role || t("sidePanel.userRole") })}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default SidePanel;
