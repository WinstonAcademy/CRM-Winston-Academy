"use client";

import LeadsTable from "@/components/tables/LeadsTable";
import PermissionRoute from "@/components/auth/PermissionRoute";

export default function LeadsPage() {
  return (
    <PermissionRoute requiredPermission="leads">
      <LeadsTable />
    </PermissionRoute>
  );
}

