import React from "react";
import {useNavigate} from "react-router-dom";

import { useLocation } from "react-router-dom";
// @ts-ignore this works
import StudentsTable from "./studentsTable.tsx";
// @ts-ignore this works
import {StaffTable} from "./staffTable.tsx";
// @ts-ignore
import SubjectsTable from "./subjectsTable.tsx";

const AdminDashboardTable: React.FC = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const tableType = params.get("type"); // "students" or "staff"
    const navigate = useNavigate();

    return (
        <div>
            {/* Back button */}
            <button
                style={{ marginBottom: "16px", padding: "8px 16px", background: "#ddd" }}
                onClick={() => navigate("/admin-dashboard")}
            >
                العودة إلى لوحة الإدارة
            </button>
            {tableType === "students" && <StudentsTable />}
            {tableType === "staff" && <StaffTable />}
            {tableType === "subjects" && <SubjectsTable />}
        </div>
    );
};

export default AdminDashboardTable;