"use client";

import UserTable from "@/components/tables/UserTable";
import PermissionRoute from "@/components/auth/PermissionRoute";

export default function UsersPage() {
  return (
    <PermissionRoute requiredPermission="users">
      <UserTable />
    </PermissionRoute>
  );
}
