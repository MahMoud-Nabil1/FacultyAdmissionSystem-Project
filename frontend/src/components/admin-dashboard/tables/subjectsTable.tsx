import React, { useEffect, useState } from "react";
import { getAllSubjects, deleteSubject } from "../../../services/api";
import Pagination from "../pagination";
import { PAGE_SIZE } from "../constants";

interface Subject {
    _id: string;
    name: string;
    creditHours: number;
    prerequisites?: any[];
}

const SubjectsTable: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [page, setPage] = useState<number>(0);

    const load = async () => {
        const data = await getAllSubjects();
        setSubjects(data);
    };

    useEffect(() => {
        load();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm("هل تريد حذف هذا المقرر؟")) return;
        await deleteSubject(id);
        await load();
    };

    const slice = subjects.slice(
        page * PAGE_SIZE,
        page * PAGE_SIZE + PAGE_SIZE
    );

    return (
        <div className="dashboard-container">
            <h2>جدول المقررات</h2>

            <table>
                <thead>
                <tr>
                    <th>اسم المقرر</th>
                    <th>عدد الساعات</th>
                    <th>المتطلبات السابقة</th>
                    <th>إجراءات</th>
                </tr>
                </thead>

                <tbody>
                {slice.map((s) => (
                    <tr key={s._id}>
                        <td>{s.name}</td>
                        <td>{s.creditHours}</td>
                        <td>
                            {(s.prerequisites || [])
                                .map((p: any) =>
                                    typeof p === "object"
                                        ? p.name
                                        : p
                                )
                                .join(", ") || "—"}
                        </td>
                        <td>
                            <button
                                className="copy-btn"
                                onClick={() =>
                                    handleDelete(s._id)
                                }
                            >
                                حذف
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <Pagination
                page={page}
                setPage={setPage}
                total={subjects.length}
            />
        </div>
    );
};

export default SubjectsTable;