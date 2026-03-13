import React, { useEffect, useState, useMemo } from "react";
import { getAllSubjects, deleteSubject } from "../../../services/api";
import Pagination from "../pagination";
import { PAGE_SIZE } from "../constants";
import { useTranslation } from "react-i18next";

interface Subject {
    _id: string;
    code: string;
    name: string;
    creditHours: number;
    prerequisites?: any[];
}

interface SubjectsTableProps {
    onEdit: (subject: Subject) => void;
}

const SubjectsTable: React.FC<SubjectsTableProps> = ({ onEdit }) => {
    const { t } = useTranslation();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [page, setPage] = useState<number>(0);
    const [search, setSearch] = useState<string>("");

    const load = async () => {
        const data = await getAllSubjects();
        setSubjects(data);
    };

    useEffect(() => {
        load();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm(t("dashboardCommon.confirmDeleteSubject"))) return;
        await deleteSubject(id);
        await load();
    };

    // Filter by code or name
    const filteredSubjects = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return subjects;
        return subjects.filter(
            (s) =>
                s.name.toLowerCase().includes(term) ||
                s.code.toLowerCase().includes(term)
        );
    }, [subjects, search]);

    const slice = filteredSubjects.slice(
        page * PAGE_SIZE,
        page * PAGE_SIZE + PAGE_SIZE
    );

    // Reset page when search changes
    useEffect(() => {
        setPage(0);
    }, [search]);

    return (
        <div className="dashboard-container">
            <h2>{t("subjectsTable.title")}</h2>

            {/* ===== Search Bar ===== */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <input
                    type="text"
                    placeholder={t("subjectsTable.searchPlaceholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    /* 2. Style matches the other tables' search bars */
                    style={{ padding: "8px", flex: "1 1 200px" }}
                />
            </div>

            {/* 3. Added the staff-table class to fix the alignment and width */}
            <table className="staff-table">
                <thead>
                <tr>
                    <th>{t("subjectsTable.code")}</th>
                    <th>{t("subjectsTable.name")}</th>
                    <th>{t("subjectsTable.creditHours")}</th>
                    <th>{t("subjectsTable.prerequisites")}</th>
                    <th>{t("dashboardCommon.actions")}</th>
                </tr>
                </thead>

                <tbody>
                {slice.map((s) => (
                    <tr key={s._id}>
                        <td>{s.code}</td>
                        <td>{s.name}</td>
                        <td>{s.creditHours}</td>
                        <td>
                            {(s.prerequisites || [])
                                .map((p: any) =>
                                    typeof p === "object" ? p.name + " (" + p.code + ")" : p
                                )
                                .join(", ") || "—"}
                        </td>
                        <td>
                            {/* 4. Using the delete-btn class we styled in CSS */}
                            <button
                                className="delete-btn"
                                onClick={() => handleDelete(s._id)}
                            >
                                {t("dashboardCommon.delete")}
                            </button>
                        </td>
                    </tr>
                ))}

                {slice.length === 0 && (
                    <tr>
                        <td colSpan={5} style={{ textAlign: "center" }}>
                            {t("dashboardCommon.noResults")}
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            <Pagination
                page={page}
                setPage={setPage}
                total={filteredSubjects.length}
            />
        </div>
    );
};

export default SubjectsTable;