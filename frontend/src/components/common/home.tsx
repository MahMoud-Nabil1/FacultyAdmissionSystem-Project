import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import "./css/home.css";
import {ROLES} from "../../services/constants";

import {useAuth} from "../../context/AuthContext";

const Home = () => {
    const navigate = useNavigate();
    const {logout, updateUser} = useAuth();
    const {t, i18n} = useTranslation();
    const isRTL = i18n.language === "ar";
    const [user, setUser] = useState<any>(null);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showReset, setShowReset] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [resetMessage, setResetMessage] = useState("");
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = sessionStorage.getItem("token");
                if (!token) {
                    setLoading(false);
                    return;
                }

                const [userRes, subjectsRes] = await Promise.all([
                    fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/auth/me`, {
                        headers: {Authorization: `Bearer ${token}`},
                    }),
                    fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/subjects`, {
                        headers: {Authorization: `Bearer ${token}`},
                    }),
                ]);

                if (!userRes.ok) {
                    if (userRes.status === 401) {
                        sessionStorage.removeItem("token");
                        window.location.href = "/login";
                    }
                    return;
                }

                const userData = await userRes.json();
                setUser(userData);
                updateUser(userData);

                if (subjectsRes.ok) {
                    const subjectsData = await subjectsRes.json();
                    setSubjects(subjectsData);
                }
            } catch (err) {
                console.error("Auth fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    // Calculate student level from completed subjects
    const studentLevel = React.useMemo(() => {
        if (!user?.completedSubjects) return null;
        let totalHours = 0;
        user.completedSubjects.forEach((completedId: string) => {
            const subject = subjects.find((s: any) => s._id === completedId);
            if (subject) totalHours += subject.creditHours || 0;
        });
        if (totalHours === 0) return '1';
        if (totalHours <= 30) return '1';
        if (totalHours <= 60) return '2';
        if (totalHours <= 90) return '3';
        return '4';
    }, [user, subjects]);

    const roleLabel: string = user?.role ? t(ROLES[user.role as keyof typeof ROLES]) || t("home.defaultRole") : "";

    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            setResetMessage(t("home.passwordMismatch"));
            return;
        }

        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({currentPassword, newPassword})
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

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("avatar", file);

        setUploading(true);
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/users/avatar`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                const updatedUser = {...user, avatar: data.avatarUrl};
                setUser(updatedUser);
                updateUser(updatedUser);
                alert(t("home.avatarUpdated"));
            } else {
                alert(data.error || t("home.avatarError"));
            }
        } catch (err) {
            console.error("Avatar upload failed:", err);
            alert(t("home.avatarError"));
        } finally {
            setUploading(false);
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
                <div className="info-card info-card-home">
                    <div className="avatar-section">
                        <img
                            src={user?.avatar ? user.avatar : "/default-avatar.png"}
                            alt="Avatar"
                            className="home-avatar"
                        />
                        <label className="upload-label">
                            {uploading ? t("home.loading") : t("home.uploadAvatar")}
                            <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading}
                                   style={{display: 'none'}}/>
                        </label>
                    </div>
                    {user?.role === "student" && studentLevel && (
                        <div className="home-level-badge">
                            <strong>{t("registration.studentLevel")}</strong>{" "}
                            <span className={`level-badge level-${studentLevel}`}>
                                {t(`registration.level${studentLevel}`)}
                            </span>
                        </div>
                    )}
                    <div className="home-info-list">
                        <p><strong>{t("home.name")}</strong> {user?.name}</p>
                        <p><strong>{t("home.role")}</strong> {roleLabel}</p>
                        {user?.department && <p><strong>{t("home.department")}</strong> {user.department}</p>}
                        {user?.gpa !== undefined && <p><strong>{t("home.gpa")}</strong> {user.gpa}</p>}
                        {user?.registeredHours !== undefined &&
                            <p><strong>{t("home.registeredHours")}</strong> {user.registeredHours}</p>}
                        {user?.completedHours !== undefined &&
                            <p><strong>{t("home.completedHours")}</strong> {user.completedHours}</p>}
                    </div>
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

                    {user?.role === "student" &&
                        (<button className="btn register" onClick={() => navigate("/register-subjects")}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            {t("home.registerSubjects")}
                        </button>)}
                    {user?.role === "student" && (
                        <button className="btn" onClick={() => navigate("/academic-history")}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                                <line x1="8" y1="7" x2="16" y2="7"/>
                                <line x1="8" y1="11" x2="14" y2="11"/>
                            </svg>
                            {t("home.academicHistory") || "Academic History"}
                        </button>
                    )}
                    {user?.role === "student" && (
                        <button className="btn" onClick={() => navigate("/students-complaints")}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10 9 9 9 8 9"/>
                            </svg>
                            {t("home.complaints") || "Students Complaints"}
                        </button>
                    )}

                    <button className="btn signout" onClick={() => {
                        logout();
                        navigate("/login");
                    }}>
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