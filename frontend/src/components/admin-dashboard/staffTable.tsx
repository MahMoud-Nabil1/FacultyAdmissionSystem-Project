import React, { useEffect, useState } from "react";
import { getAllStaff, deleteStaff } from "../../services/api";
import { ROLES } from "./constants";

interface Staff {
    _id: string;
    name: string;
    email: string;
    role: keyof typeof ROLES;
}

const StaffTable: React.FC = () => {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const loadStaff = async () => {
        try {
            const data = await getAllStaff();
            setStaff(data);
        } catch {
            setError("فشل تحميل قائمة الموظفين");
        }
    };

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا الموظف؟")) return;
        try {
            await deleteStaff(id);
            await loadStaff();
        } catch {
            setError("فشل حذف الموظف");
        }
    };

    useEffect(() => {
        loadStaff();
    }, []);

    return (
        <div className="dashboard-container">
            <h2>جدول الموظفين</h2>
            {error && <p className="error">{error}</p>}

            <table className="staff-table">
                <thead>
                <tr>
                    <th>الإسم</th>
                    <th>الإيميل</th>
                    <th>الرتبة</th>
                    <th>نسخ ID</th>
                    <th>حذف</th>
                </tr>
                </thead>
                <tbody>
                {staff.map((s) => (
                    <tr key={s._id}>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{ROLES[s.role]}</td>
                        <td>
                            <button
                                className="copy-btn"
                                onClick={() => handleCopy(s._id)}
                            >
                                {copiedId === s._id ? "تم!" : "نسخ"}
                            </button>
                        </td>
                        <td>
                            <button
                                className="delete-btn"
                                onClick={async () => {
                                    if (window.confirm("هل أنت متأكد من حذف الموظف؟")) {
                                        try {
                                            await deleteStaff(s._id);
                                            setStaff((prev) => prev.filter((x) => x._id !== s._id));
                                        } catch (err: any) {
                                            alert(err.message || "فشل الحذف");
                                        }
                                    }
                                }}
                            >
                                حذف
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default StaffTable;