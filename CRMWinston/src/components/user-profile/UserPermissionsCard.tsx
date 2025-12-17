"use client";
import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function UserPermissionsCard() {
  const { user } = useAuth();

  if (!user) return null;

  const permissions = [
    { name: 'Leads Access', value: user.canAccessLeads, color: user.canAccessLeads ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
    { name: 'Students Access', value: user.canAccessStudents, color: user.canAccessStudents ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
    { name: 'Users Access', value: user.canAccessUsers, color: user.canAccessUsers ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
    { name: 'Dashboard Access', value: user.canAccessDashboard, color: user.canAccessDashboard ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
  ];

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
          Permissions & Access
        </h4>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
          {permissions.map((permission) => (
            <div key={permission.name}>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {permission.name}
              </p>
              <p className={`text-sm font-medium ${permission.color}`}>
                {permission.value ? '✓ Enabled' : '✗ Disabled'}
              </p>
            </div>
          ))}
          
          <div>
            <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Account Status
            </p>
            <p className={`text-sm font-medium ${user.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {user.isActive ? '✓ Active' : '✗ Inactive'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
