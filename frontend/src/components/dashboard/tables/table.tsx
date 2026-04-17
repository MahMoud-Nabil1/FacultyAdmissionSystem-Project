import React from "react";
import { Navigate, useLocation } from "react-router-dom";
// @ts-ignore this works
import StudentsTable from "./studentsTable.tsx";
// @ts-ignore this works
import {StaffTable} from "./staffTable.tsx";
// @ts-ignore
import SubjectsTable from "./subjectsTable.tsx";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";

const AdminDashboardTable: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const tableType = params.get("type"); // "students" or "staff"

    if (user?.role === 'reporter' && tableType !== 'subjects') {
        return <Navigate to="/admin-dashboard/groups" replace />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
            {tableType === "students" && <StudentsTable />}
            {tableType === "staff" && <StaffTable />}
            {tableType === "subjects" && <SubjectsTable />}
        </div>
    );
};

export default AdminDashboardTable;