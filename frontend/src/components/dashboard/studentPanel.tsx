import React, { useState, FormEvent } from "react";
import { createStudent } from "../../services/api";
import { useNavigate } from "react-router-dom";

interface StudentForm {
    studentId: string;
    name: string;
    email: string;
    password: string;
    gpa: string;
}

const StudentPanel: React.FC = () => {
    const [form, setForm] = useState<StudentForm>({
        studentId: "",
        name: "",
        email: "",
        password: "",
        gpa: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [showForm, setShowForm] = useState<boolean>(false);

    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await createStudent(form);
            setForm({ studentId: "", name: "", email: "", password: "", gpa: "" });
            setShowForm(false);
        } catch (err: any) {
            if (err.status === 409) {
                setError("طالب بنفس الكود موجود بالفعل");
            } else {
                setError(err.data?.error || err.message || "حدث خطأ غير متوقع");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <h2>الطلاب</h2>

            {/* Toggle form */}
            <button className="panel-btn" onClick={() => setShowForm(prev => !prev)}>
                {showForm ? "الغاء" : "اضف طالب جديد"}
            </button>

            {showForm && (
                <form className="form" onSubmit={handleSubmit}>
                    {error && <p className="error">{error}</p>}

                    <input
                        placeholder="كود الطالب"
                        value={form.studentId}
                        onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                    />
                    <input
                        placeholder="الإسم"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <input
                        placeholder="الإيميل"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <input
                        placeholder="المعدل التراكمى"
                        value={form.gpa}
                        onChange={(e) => setForm({ ...form, gpa: e.target.value })}
                    />
                    <input
                        type="password"
                        placeholder="كلمة السر"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />

                    <button className="submit-btn" disabled={loading}>
                        {loading ? "جارٍ التسجيل..." : "سجل طالب جديد"}
                    </button>
                </form>
            )}

            {/* Navigate to students table */}
            <button
                className="view-table-btn"
                onClick={() => navigate("/admin-dashboard/table?type=students")}
            >
                عرض جميع الطلاب
            </button>
        </div>
    );
};

export default StudentPanel;