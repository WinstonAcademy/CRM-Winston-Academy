"use client";

import AgenciesTable from "@/components/tables/AgenciesTable";
import PermissionRoute from "@/components/auth/PermissionRoute";

export default function AgenciesPage() {
  return (
    <PermissionRoute requiredPermission="dashboard">
      <AgenciesTable />
    </PermissionRoute>
  );
}

