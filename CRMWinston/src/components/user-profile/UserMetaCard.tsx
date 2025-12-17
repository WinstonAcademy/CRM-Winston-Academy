"use client";
import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function UserMetaCard() {
  const { user } = useAuth();

  const getRoleDisplay = () => {
    // Use userRole (enumeration) instead of role (relation object)
    const role = user?.userRole;
    if (!role) return 'User';
    // Convert 'team_member' to 'Team Member' and 'admin' to 'Admin'
    return role === 'team_member' ? 'Team Member' : role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-4">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.username || 'User Profile'
                }
              </h4>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span> {user?.email || 'No email provided'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">Username:</span> {user?.username || 'Not provided'}
          </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">Role:</span> {getRoleDisplay()}
          </p>
          {user?.phone && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">Phone:</span> {user.phone}
            </p>
          )}
        </div>
      </div>
        </div>
  );
}
