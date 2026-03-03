import React from "react";
import { useLocation } from "react-router-dom";
// @ts-ignore this works
import StudentsTable from "./studentsTable.tsx";
// @ts-ignore this works
import {StaffTable} from "./staffTable.tsx";

const AdminDashboardTable: React.FC = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const tableType = params.get("type"); // "students" or "staff"

    return (
        <div>
            {tableType === "students" && <StudentsTable />}
            {tableType === "staff" && <StaffTable />}
        </div>
    );
};

export default AdminDashboardTable;