import React, { useMemo } from "react";
import { Outlet } from "react-router-dom";
import { AdminDashboardContext } from "../../context/AdminDashboardContext";

export default function AdminDashboardLayout() {
  const value = useMemo(() => ({}), []);

  return (
    <AdminDashboardContext.Provider value={value}>
      <Outlet />
    </AdminDashboardContext.Provider>
  );
}
