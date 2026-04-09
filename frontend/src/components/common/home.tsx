import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./css/home.css";
import { ROLES } from "../../services/constants";

import { useAuth } from "../../context/AuthContext";

const Home = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === "ar";
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showReset, setShowReset] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [resetMessage, setResetMessage] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = sessionStorage.getItem("token");
                if (!token) {
                    setLoading(false);
                    return;
                }
                
                const res = await fetch("http://localhost:5000/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                if (!res.ok) {
                    if (res.status === 401) {
                        sessionStorage.removeItem("token");
                        window.location.href = "/login";
                    }
                    return;
                }
                
                const data = await res.json();
                setUser(data);
            } catch (err) {
                console.error("Auth fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [navigate]);

    const roleLabel: string = user?.role ? t(ROLES[user.role as keyof typeof ROLES]) || t("home.defaultRole") : "";

    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            setResetMessage(t("home.passwordMismatch"));
            return;
        }

        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/auth/change-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();
            if (res.ok) {
                setResetMessage(t("home.passwordUpdateSuccess"));
                setTimeout(() => {
                    setShowReset(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setResetMessage("");
                }, 1500);
            } else {
                setResetMessage(data.error || t("home.passwordUpdateError"));
            }
        } catch (err) {
            setResetMessage(t("home.passwordUpdateError"));
            console.error(err);
        }
    };

    const closeModal = () => {
        setShowReset(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setResetMessage("");
    };

    if (loading) return <p className="loading">{t("home.loading")}</p>;

    return (
        <div className="home-container" dir={isRTL ? "rtl" : "ltr"}>
            <h1 className="home-title">{t("home.title")}</h1>

            <div className="home-content">
                <div className="info-card">
                    <p><strong>{t("home.name")}</strong> {user?.name}</p>
                    <p><strong>{t("home.role")}</strong> {roleLabel}</p>
                    {user?.department && <p><strong>{t("home.department")}</strong> {user.department}</p>}
                    {user?.gpa !== undefined && <p><strong>{t("home.gpa")}</strong> {user.gpa}</p>}
                    {user?.registeredHours !== undefined && <p><strong>{t("home.registeredHours")}</strong> {user.registeredHours}</p>}
                    {user?.completedHours !== undefined && <p><strong>{t("home.completedHours")}</strong> {user.completedHours}</p>}
                </div>

                <div className="buttons-horizontal">
                    <button className="btn" onClick={() => navigate("/groups")}>
                        {t("home.viewAllGroups")}
                    </button>

                    {user?.role && user.role !== "student" && (
                        <button className="btn admin" onClick={() => navigate("/admin-dashboard")}>
                            {t("home.adminDashboard")}
                        </button>
                    )}

                    <button className="btn reset" onClick={() => setShowReset(true)}>
                        {t("home.changePassword")}
                    </button>

                    <button className="btn register" onClick={() => navigate("/register-subjects")}>
                        {t("home.registerSubjects")}
                    </button>

                    {user?.role === "student" && (
                        <button className="btn" onClick={() => navigate("/academic-history")}>
                            {t("home.academicHistory") || "Academic History"}
                        </button>
                    )}
                    {user?.role === "student" && (
                        <button className="btn" onClick={() => navigate("/students-complaints")}>
                            {t("home.complaints") || "Students Complaints"}
                        </button>
                    )}

                    <button className="btn signout" onClick={() => { logout(); navigate("/login"); }}>
                        {t("sidePanel.signOut")}
                    </button>
                </div>
            </div>

            {showReset && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>&times;</button>
                        <h3>{t("home.changePasswordTitle")}</h3>
                        <input
                            type="password"
                            placeholder={t("home.currentPasswordPlaceholder")}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder={t("home.newPasswordPlaceholder")}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder={t("home.confirmPasswordPlaceholder")}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button className="btn submit" onClick={handleResetPassword}>
                            {t("home.save")}
                        </button>
                        {resetMessage && <p className="reset-message">{resetMessage}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;