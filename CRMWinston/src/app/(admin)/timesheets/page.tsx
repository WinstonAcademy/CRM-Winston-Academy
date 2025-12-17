"use client";

import TimesheetTable from "@/components/tables/TimesheetTable";
import PermissionRoute from "@/components/auth/PermissionRoute";

export default function TimesheetsPage() {
  return (
    <PermissionRoute requiredPermission="timesheets">
      <TimesheetTable />
    </PermissionRoute>
  );
}

