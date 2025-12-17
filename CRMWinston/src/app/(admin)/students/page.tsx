"use client";

import StudentTable from "@/components/tables/StudentTable";
import PermissionRoute from "@/components/auth/PermissionRoute";

export default function StudentsPage() {
  return (
    <PermissionRoute requiredPermission="students">
      <StudentTable />
    </PermissionRoute>
  );
}

