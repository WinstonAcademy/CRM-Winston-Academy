"use client";

import LeadsTable from "@/components/tables/LeadsTable";
import PermissionRoute from "@/components/auth/PermissionRoute";

export default function LeadsPage() {
  return (
    <PermissionRoute requiredPermission="leads">
      <div className="w-full max-w-full min-w-0 overflow-hidden">
        <LeadsTable />
      </div>
    </PermissionRoute>
  );
}

