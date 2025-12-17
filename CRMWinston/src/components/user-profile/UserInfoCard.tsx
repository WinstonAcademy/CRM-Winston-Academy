"use client";
import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function UserInfoCard() {
  const { user } = useAuth();

  const getRoleDisplay = () => {
    // Use userRole (enumeration) instead of role (relation object)
    const role = user?.userRole;
    if (!role) return 'Not provided';
    // Convert 'team_member' to 'Team Member' and 'admin' to 'Admin'
    return role === 'team_member' ? 'Team Member' : role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
              Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.username || 'Not provided'}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.email || 'Not provided'}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Username
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.username || 'Not provided'}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Role
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {getRoleDisplay()}
            </p>
          </div>

          {user?.phone && (
                  <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Phone Number
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user.phone}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
