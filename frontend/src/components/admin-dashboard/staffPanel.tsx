import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { createStaff, getAllStaff } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { PAGE_SIZE, ROLES } from "./constants";

interface Staff {
    _id: string;
    name: string;
    email: string;
    role: keyof typeof ROLES;
}

interface StaffForm {
    name: string;
    email: string;
    role: keyof typeof ROLES;
    password: string;
}

const StaffPanel: React.FC = () => {
    const [staff, setStaff] = useState<Staff[]>([]);
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

    // Load staff count (optional)
    const loadStaff = async () => {
        try {
            const data = await getAllStaff();
            setStaff(data);
        } catch {
            setError("فشل تحميل قائمة الموظفين");
        }
    };

    useEffect(() => {
        loadStaff();
    }, []);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await createStaff(form);
            setForm({ name: "", email: "", role: "admin", password: "" });
            setShowForm(false);
            await loadStaff();
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

            {/* Toggle form */}
            <button
                className="add-btn"
                onClick={() => setShowForm((prev) => !prev)}
            >
                {showForm ? "إلغاء" : "اضف موظف جديد"}
            </button>

            {showForm && (
                <form className="form" onSubmit={handleSubmit}>
                    {error && <p className="error">{error}</p>}

                    <input
                        name="name"
                        placeholder="الإسم"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                    <input
                        name="email"
                        placeholder="الإيميل"
                        value={form.email}
                        onChange={handleChange}
                        required
                    />
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
                    <input
                        name="password"
                        type="password"
                        placeholder="كلمة السر"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                    <button className="submit-btn" disabled={loading}>
                        {loading ? "جارٍ التسجيل..." : "سجل موظف جديد"}
                    </button>
                </form>
            )}

            {/* Button to navigate to full staff table */}
            <button
                className="view-table-btn"
                onClick={() => navigate("/admin-dashboard/table")}
            >
                عرض جميع الموظفين ({staff.length})
            </button>
        </div>
    );
};

export default StaffPanel;