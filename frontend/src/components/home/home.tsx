import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/home.css";
import { ROLES } from "../dashboard/constants";

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");

                const res = await fetch("http://localhost:5000/api/auth/me", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
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

    if (loading) return <p className="loading">جاري التحميل...</p>;

    const roleLabel: string = user?.role ? ROLES[user.role] || "طالب" : "";

    return (
        <div className="home-container">
            <h1 className="home-title">الصفحة الرئيسية</h1>

            <div className="info-card">
                <p><strong>الاسم:</strong> {user?.name}</p>
                <p><strong>الدور:</strong> {roleLabel}</p>
                {user?.department && (
                    <p><strong>القسم:</strong> {user.department}</p>
                )}
                {user?.gpa !== undefined && (
                    <p><strong>المعدل التراكمي:</strong> {user.gpa}</p>
                )}
                {user?.registeredHours !== undefined && (
                    <p><strong>الساعات المسجلة:</strong> {user.registeredHours}</p>
                )}
                {user?.completedHours !== undefined && (
                    <p><strong>الساعات المكتملة:</strong> {user.completedHours}</p>
                )}
            </div>

            <div className="buttons">
                <button
                    className="btn"
                    onClick={() => navigate("/groups")}
                >
                    عرض كل المجموعات
                </button>

                {user?.role && user.role !== "student" && (
                    <button
                        className="btn admin"
                        onClick={() => navigate("/admin-dashboard")}
                    >
                        لوحة تحكم الادمن
                    </button>
                )}
            </div>
        </div>
    );
};

export default Home;