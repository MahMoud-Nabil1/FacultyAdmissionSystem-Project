import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/home.css";
import { ROLES } from "../dashboard/constants";

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showReset, setShowReset] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetMessage, setResetMessage] = useState("");

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Unauthorized");
                const data = await res.json();
                setUser(data);
            } catch (err) {
                console.error(err);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [navigate]);

    const roleLabel: string = user?.role ? ROLES[user.role] || "طالب" : "";

    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            setResetMessage("كلمة المرور الجديدة وتأكيدها غير متطابقين");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ token, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setResetMessage("تم تحديث كلمة المرور بنجاح");
                setShowReset(false);
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setResetMessage(data.error || "حدث خطأ أثناء تحديث كلمة المرور");
            }
        } catch (err) {
            setResetMessage("حدث خطأ أثناء تحديث كلمة المرور");
            console.error(err);
        }
    };

    if (loading) return <p className="loading">جاري التحميل...</p>;

    return (
        <div className="home-container">
            <h1 className="home-title">الصفحة الرئيسية</h1>

            <div className="info-card">
                <p><strong>الاسم:</strong> {user?.name}</p>
                <p><strong>الدور:</strong> {roleLabel}</p>
                {user?.department && <p><strong>القسم:</strong> {user.department}</p>}
                {user?.gpa !== undefined && <p><strong>المعدل التراكمي:</strong> {user.gpa}</p>}
                {user?.registeredHours !== undefined && <p><strong>الساعات المسجلة:</strong> {user.registeredHours}</p>}
                {user?.completedHours !== undefined && <p><strong>الساعات المكتملة:</strong> {user.completedHours}</p>}
            </div>

            <div className="buttons-vertical">
                <button className="btn" onClick={() => navigate("/groups")}>
                    عرض كل المجموعات
                </button>

                {user?.role && user.role !== "student" && (
                    <button className="btn admin" onClick={() => navigate("/admin-dashboard")}>
                        لوحة تحكم الادمن
                    </button>
                )}

                <button className="btn reset" onClick={() => setShowReset(!showReset)}>
                    تغيير كلمة المرور
                </button>

                <button className="btn register" onClick={() => navigate("/register-subjects")}>
                    تسجيل المواد
                </button>
            </div>

            {showReset && (
                <div className="reset-panel">
                    <h3>تغيير كلمة المرور</h3>
                    <input
                        type="password"
                        placeholder="كلمة المرور الجديدة"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="تأكيد كلمة المرور"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button className="btn submit" onClick={handleResetPassword}>
                        حفظ
                    </button>
                    {resetMessage && <p className="reset-message">{resetMessage}</p>}
                </div>
            )}
        </div>
    );
};

export default Home;