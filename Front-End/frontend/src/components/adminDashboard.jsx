import React from "react";
import { CreatStaff, CreatStudent } from "../services/api";

const AdminDashboard = () => {
    return (
        <div>
            <button onClick={CreatStaff}>Add Staff</button>
            <button onClick={CreatStudent}>Add Student</button>
        </div>
    );
};

export default AdminDashboard;

