import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllStudents, deleteStudent } from "../../../services/api";
import Pagination from "../pagination";
import { PAGE_SIZE } from "../constants";

interface Student {
    _id: string;
    studentId: string;
    name: string;
    email: string;
    gpa: string;
}

const StudentsTable: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [searchId, setSearchId] = useState("");
    const [page, setPage] = useState(0);

    const navigate = useNavigate();

    const loadStudents = async () => {
        try {
            const data = await getAllStudents();
            setStudents(data);
        } catch {
            setError("فشل تحميل قائمة الطلاب");
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    useEffect(() => {
        // Filter by ID if search input is provided
        let temp = students;
        if (searchId.trim() !== "") {
            temp = students.filter((s) => s._id.includes(searchId.trim()));
        }
        setFilteredStudents(temp);
        setPage(0); // reset page when filtering
    }, [students, searchId]);

    const handleCopy = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا الطالب؟")) return;
        try {
            await deleteStudent(id);
            setStudents((prev) => prev.filter((s) => s._id !== id));
        } catch {
            setError("فشل حذف الطالب");
        }
    };

    // Pagination slice
    const pagedStudents = filteredStudents.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div className="dashboard-container">
            <h2>جدول الطلاب</h2>
            {error && <p className="error">{error}</p>}

            {/* Back button */}
            <button
                style={{ marginBottom: "16px", padding: "8px 16px", background: "#ddd" }}
                onClick={() => navigate("/admin-dashboard")}
            >
                العودة إلى لوحة الإدارة
            </button>

            {/* Search by ID */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <input
                    type="text"
                    placeholder="بحث بالـ ID"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    style={{ padding: "8px", flex: "1 1 200px" }}
                />
            </div>

            <table className="staff-table">
                <thead>
                <tr>
                    <th>كود الطالب</th>
                    <th>الإسم</th>
                    <th>الإيميل</th>
                    <th>المعدل التراكمى</th>
                    <th>نسخ ID</th>
                    <th>حذف</th>
                </tr>
                </thead>
                <tbody>
                {pagedStudents.map((s) => (
                    <tr key={s._id}>
                        <td>{s.studentId}</td>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.gpa}</td>
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
                                onClick={() => handleDelete(s._id)}
                            >
                                حذف
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Pagination */}
            <Pagination page={page} setPage={setPage} total={filteredStudents.length} />
        </div>
    );
};

export default StudentsTable;