import React from "react";
import { useLocation } from "react-router-dom";
// @ts-ignore this works
import StudentsTable from "./studentsTable.tsx";
// @ts-ignore this works
import { StaffTable } from "./staffTable.tsx";
// @ts-ignore
import SubjectsTable from "./subjectsTable.tsx";
import StudentPanel from "../studentPanel.tsx";
import StaffPanel from "../staffPanel.tsx";
import SubjectPanel from "../SubjectPanel";

const AdminDashboardTable = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const tableType = params.get("type");

    return (
        <div>
            {tableType === "students" && (
                <StudentsTable footerContent={<StudentPanel />} />
            )}
            {tableType === "staff" && (
                <StaffTable footerContent={<StaffPanel />} />
            )}
            {tableType === "subjects" && (
                <SubjectsTable footerContent={<SubjectPanel />} />
            )}
        </div>
    );
};

export default AdminDashboardTable;