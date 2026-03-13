import React from "react";
import {useNavigate} from "react-router-dom";

import { useLocation } from "react-router-dom";
// @ts-ignore this works
import StudentsTable from "./studentsTable.tsx";
// @ts-ignore this works
import {StaffTable} from "./staffTable.tsx";
// @ts-ignore
import SubjectsTable from "./subjectsTable.tsx";
import { useTranslation } from "react-i18next";

const AdminDashboardTable: React.FC = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const tableType = params.get("type"); // "students" or "staff"
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
            {tableType === "students" && <StudentsTable />}
            {tableType === "staff" && <StaffTable />}
            {tableType === "subjects" && <SubjectsTable />}
        </div>
    );
};

export default AdminDashboardTable;