import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllStaff, deleteStaff } from "../../../services/api";
import { ROLES } from "../constants";
import Pagination from "../pagination";
import { PAGE_SIZE } from "../constants";

interface Staff {
    _id: string;
    name: string;
    email: string;
    role: keyof typeof ROLES;
}

export const StaffTable: React.FC = () => {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchId, setSearchId] = useState("");
    const [filterRole, setFilterRole] = useState<keyof typeof ROLES | "all">("all");
    const [page, setPage] = useState(0);

    const navigate = useNavigate();

    const loadStaff = async () => {
        try {
            const data = await getAllStaff();
            setStaff(data);
        } catch {
            setError("فشل تحميل قائمة الموظفين");
        }
    };

    useEffect(() => {
        // Apply filtering by role and searchId
        let temp = [...staff];

        if (filterRole !== "all") {
            temp = temp.filter((s) => s.role === filterRole);
        }

        if (searchId.trim() !== "") {
            temp = temp.filter((s) => s._id.includes(searchId.trim()));
        }

        setFilteredStaff(temp);
        setPage(0); // Reset to first page when filtering
    }, [staff, searchId, filterRole]);

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا الموظف؟")) return;
        try {
            await deleteStaff(id);
            setStaff((prev) => prev.filter((x) => x._id !== id));
        } catch {
            setError("فشل حذف الموظف");
        }
    };

    useEffect(() => {
        loadStaff();
    }, []);

    // Pagination slice
    const pagedStaff = filteredStaff.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div className="dashboard-container">
            <h2>جدول الموظفين</h2>
            {error && <p className="error">{error}</p>}

            {/* Back button */}
            <button
                style={{ marginBottom: "16px", padding: "8px 16px", background: "#ddd" }}
                onClick={() => navigate("/admin-dashboard")}
            >
                العودة إلى لوحة الإدارة
            </button>

            {/* Top filter/search bar */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <input
                    type="text"
                    placeholder="بحث بالـ ID"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    style={{ padding: "8px", flex: "1 1 200px" }}
                />
                <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as keyof typeof ROLES | "all")}
                    style={{ padding: "8px", flex: "0 0 150px" }}
                >
                    <option value="all">الكل</option>
                    {Object.entries(ROLES).map(([v, l]) => (
                        <option key={v} value={v}>
                            {l}
                        </option>
                    ))}
                </select>
            </div>

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
                {pagedStaff.map((s) => (
                    <tr key={s._id}>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{ROLES[s.role]}</td>
                        <td>
                            <button className="copy-btn" onClick={() => handleCopy(s._id)}>
                                {copiedId === s._id ? "تم!" : "نسخ"}
                            </button>
                        </td>
                        <td>
                            <button className="delete-btn" onClick={() => handleDelete(s._id)}>
                                حذف
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Pagination */}
            <Pagination page={page} setPage={setPage} total={filteredStaff.length} />
        </div>
    );
};