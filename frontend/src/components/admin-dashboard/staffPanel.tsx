import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { createStaff, getAllStaff } from "../../services/api";
import Pagination from "./pagination";
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
    const [page, setPage] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<StaffForm>({
        name: "",
        email: "",
        role: "admin",
        password: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

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

    const paginatedStaff = staff.slice(
        page * PAGE_SIZE,
        page * PAGE_SIZE + PAGE_SIZE
    );

    return (
        <div className="dashboard-container">
            <h2>الموظفين</h2>

            <button
                className="add-btn"
                onClick={() => setShowForm((prev) => !prev)}
            >
                {showForm ? "إلغاء" : "اضف موظف جديد"}
            </button>

            {error && <p className="error">{error}</p>}

            {showForm && (
                <form className="form" onSubmit={handleSubmit}>
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

            <table>
                <thead>
                <tr>
                    <th>الإسم</th>
                    <th>الإيميل</th>
                    <th>الرتبة</th>
                    <th>ID</th>
                </tr>
                </thead>
                <tbody>
                {paginatedStaff.map((s) => (
                    <tr key={s._id}>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{ROLES[s.role]}</td>
                        <td>
                            <button
                                className="copy-btn"
                                onClick={() => {
                                    navigator.clipboard.writeText(s._id);
                                    setCopiedId(s._id);
                                    setTimeout(() => setCopiedId(null), 2000);
                                }}
                            >
                                {copiedId === s._id ? "تم!" : "نسخ"}
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <Pagination page={page} setPage={setPage} total={staff.length} />
        </div>
    );
};

export default StaffPanel;