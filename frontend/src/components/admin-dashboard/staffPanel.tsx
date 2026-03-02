import React, {ChangeEvent, FormEvent, useState} from "react";
import {createStaff} from "../../services/api";
import {useNavigate} from "react-router-dom";
import {ROLES} from "./constants";

interface StaffForm {
    name: string;
    email: string;
    role: keyof typeof ROLES;
    password: string;
}

const StaffPanel: React.FC = () => {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<StaffForm>({
        name: "",
        email: "",
        role: "admin",
        password: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const {name, value} = e.target;
        setForm((prev) => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await createStaff(form);
            setForm({name: "", email: "", role: "admin", password: ""});
            setShowForm(false);
        } catch (err: any) {
            if (err.status === 409) {
                setError("يوجد موظف بنفس الإيميل بالفعل");
            } else {
                setError(err.message || "حدث خطأ غير متوقع");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <h2>الموظفين</h2>

            {/* Buttons */}
            <div style={{display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "20px"}}>
                <button
                    className="panel-btn"
                    onClick={() => setShowForm((prev) => !prev)}
                >
                    {showForm ? "إلغاء" : "اضف موظف جديد"}
                </button>

                <button
                    className="panel-btn"
                    onClick={() => navigate("/admin-dashboard/table?type=staff")}
                >
                    عرض جميع الموظفين
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form className="form" onSubmit={handleSubmit}>
                    {error && <p className="error">{error}</p>}

                    <div className="form-group">
                        <label>الإسم</label>
                        <input
                            name="name"
                            placeholder="أدخل الاسم الكامل"
                            value={form.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>الإيميل</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="أدخل البريد الإلكتروني"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>الرتبة</label>
                        <select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            required
                        >
                            {Object.entries(ROLES).map(([v, l]) => (
                                <option key={v} value={v}>
                                    {l}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>كلمة السر</label>
                        <input
                            name="password"
                            type="password"
                            placeholder="أدخل كلمة السر"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button className="submit-btn" disabled={loading}>
                        {loading ? "جارٍ التسجيل..." : "سجل موظف جديد"}
                    </button>
                </form>
            )}
        </div>
    );
};

export default StaffPanel;