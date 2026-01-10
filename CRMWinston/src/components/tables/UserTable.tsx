"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";
import { simpleUserService, User } from "../../services/simpleUserService";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";

const getRoleColor = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    case "team_member":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "admin":
      return "Admin";
    case "team_member":
      return "Team Member";
    default:
      return "Unknown";
  }
};

const getStatusColor = (isActive: boolean) => {
  return isActive
    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
};

export default function UserTable() {
  const { user: currentUser, refreshUser } = useAuth();
  const { canViewUsers, canCreateUsers, canEditUsers, canDeleteUsers, canManageRoles } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await simpleUserService.getUsers();
      setUsers(response);
      setLastSyncTime(new Date());
      console.log('✅ Users fetched successfully:', response.length, 'users');
    } catch (error: unknown) {
      console.error('Error fetching users:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'team_member';
    canAccessLeads: boolean;
    canAccessStudents: boolean;
    canAccessUsers: boolean;
    canAccessDashboard: boolean;
  }) => {
    try {
      await simpleUserService.createUser(userData);
      await fetchUsers();
      setShowAddUserForm(false);
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      alert(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  const handleUpdateUser = async (id: number, userData: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: 'admin' | 'team_member';
    canAccessLeads?: boolean;
    canAccessStudents?: boolean;
    canAccessUsers?: boolean;
    canAccessDashboard?: boolean;
    isActive?: boolean;
  }) => {
    console.log('🔄 handleUpdateUser called with:', { id, userData });
    try {
      // Separate profile data from permission data
      const profileData = {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role
      };
      
      const permissionData = {
        canAccessLeads: userData.canAccessLeads,
        canAccessStudents: userData.canAccessStudents,
        canAccessUsers: userData.canAccessUsers,
        canAccessDashboard: userData.canAccessDashboard,
        isActive: userData.isActive
      };
      
      console.log('🔄 Profile data:', profileData);
      console.log('🔄 Permission data:', permissionData);
      
      // Update profile if there are profile changes
      const hasProfileChanges = Object.values(profileData).some(value => value !== undefined);
      console.log('🔄 Has profile changes:', hasProfileChanges);
      if (hasProfileChanges) {
        console.log('🔄 Calling updateUserProfile...');
        await simpleUserService.updateUserProfile(id, profileData);
        console.log('✅ updateUserProfile completed');
      }
      
      // Update permissions if there are permission changes
      const hasPermissionChanges = Object.values(permissionData).some(value => value !== undefined);
      console.log('🔄 Has permission changes:', hasPermissionChanges);
      if (hasPermissionChanges) {
        console.log('🔄 Calling updateUserPermissions...');
        await simpleUserService.updateUserPermissions(id, permissionData);
        console.log('✅ updateUserPermissions completed');
      }
      
      console.log('🔄 Fetching users...');
      await fetchUsers();
      setEditingUser(null);
      console.log('✅ User update completed successfully');
    } catch (error: unknown) {
      console.error('❌ Error updating user:', error);
      alert(error instanceof Error ? error.message : 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await simpleUserService.updateUserPermissions(id, { isActive: false });
      await fetchUsers();
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const handlePermissionToggle = async (userId: number, permission: string, value: boolean) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      const updatedPermissions = {
        canAccessLeads: user.canAccessLeads,
        canAccessStudents: user.canAccessStudents,
        canAccessUsers: user.canAccessUsers,
        canAccessDashboard: user.canAccessDashboard,
        [permission]: value
      };
      
      await simpleUserService.updateUserPermissions(userId, updatedPermissions);
      await fetchUsers();
      
      // If we updated the current user's permissions, refresh the auth context
      if (currentUser && userId === currentUser.id) {
        await refreshUser();
      }
      
      // Show success message
      const permissionName = permission.replace('canAccess', '').toLowerCase();
      console.log(`Permission "${permissionName}" has been ${value ? 'enabled' : 'disabled'} for ${user.username}`);
    } catch (error: unknown) {
      console.error('Error updating permission:', error);
      alert(error instanceof Error ? error.message : 'Failed to update permission');
    }
  };

  const handleStatusToggle = async (userId: number, isActive: boolean) => {
    const user = users.find(u => u.id === userId);
    const action = isActive ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} ${user?.username}?`)) {
      return;
    }
    
    try {
      await simpleUserService.updateUserPermissions(userId, { isActive });
      await fetchUsers();
      
      // If we updated the current user's status, refresh the auth context
      if (currentUser && userId === currentUser.id) {
        await refreshUser();
      }
      
      // Show success message
      console.log(`User ${user?.username} has been ${action}d successfully`);
    } catch (error: unknown) {
      console.error('Error updating user status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };

  // Filter users based on search term and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === '' || user.role === roleFilter;
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (!canViewUsers()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Access Denied
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage system users and their permissions</p>
          {lastSyncTime && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Last synced: {lastSyncTime.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            🔄 Refresh
          </button>
          {canCreateUsers() && (
            <button
              onClick={() => setShowAddUserForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="search" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Search
          </Label>
          <Input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or username..."
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="roleFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Role
          </Label>
          <Select
            options={[
              { value: "", label: "All Roles" },
              { value: "admin", label: "Admin" },
              { value: "team_member", label: "Team Member" }
            ]}
            value={roleFilter}
            onChange={(value) => setRoleFilter(value)}
            className="mt-1"
            placeholder="All Roles"
          />
        </div>
        
        <div>
          <Label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </Label>
          <Select
            options={[
              { value: "", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" }
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            className="mt-1"
            placeholder="All Status"
          />
        </div>
      </div>

      {/* User Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Leads Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Students Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Users Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Dashboard Access
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-red-600 dark:text-red-400">
                    {error}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {user.firstName?.[0] || user.username[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.id === currentUser?.id ? (
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(user.isActive ?? false)}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      ) : (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.isActive}
                            onChange={(e) => handleStatusToggle(user.id, e.target.checked)}
                            className="sr-only peer"
                            disabled={!canManageRoles()}
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-600 dark:peer-checked:bg-green-500 peer-disabled:opacity-50"></div>
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.canAccessLeads}
                          onChange={(e) => handlePermissionToggle(user.id, 'canAccessLeads', e.target.checked)}
                          className="sr-only peer"
                          disabled={!canManageRoles()}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 peer-disabled:opacity-50"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.canAccessStudents}
                          onChange={(e) => handlePermissionToggle(user.id, 'canAccessStudents', e.target.checked)}
                          className="sr-only peer"
                          disabled={!canManageRoles()}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 peer-disabled:opacity-50"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.canAccessUsers}
                          onChange={(e) => handlePermissionToggle(user.id, 'canAccessUsers', e.target.checked)}
                          className="sr-only peer"
                          disabled={!canManageRoles()}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 peer-disabled:opacity-50"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={user.canAccessDashboard}
                          onChange={(e) => handlePermissionToggle(user.id, 'canAccessDashboard', e.target.checked)}
                          className="sr-only peer"
                          disabled={!canManageRoles()}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 peer-disabled:opacity-50"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {canEditUsers() && (
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            Edit
                          </button>
                        )}
                        {canDeleteUsers() && user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Form Modal */}
      {showAddUserForm && (
        <AddUserForm
          onSave={handleCreateUser}
          onCancel={() => setShowAddUserForm(false)}
        />
      )}

      {/* Edit User Form Modal */}
      {editingUser && (
        <EditUserForm
          user={editingUser}
          onSave={(userData) => handleUpdateUser(editingUser.id, userData)}
          onCancel={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}

// Add User Form Component
const AddUserForm: React.FC<{
  onSave: (userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'team_member';
    canAccessLeads: boolean;
    canAccessStudents: boolean;
    canAccessUsers: boolean;
    canAccessDashboard: boolean;
  }) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'team_member' as 'admin' | 'team_member',
    canAccessLeads: false,
    canAccessStudents: false,
    canAccessUsers: false,
    canAccessDashboard: false,
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Add New User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>
          
          
          <div>
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value as any })}
              options={[
                { value: "team_member", label: "Team Member" },
                { value: "admin", label: "Admin" }
              ]}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Form Component
const EditUserForm: React.FC<{
  user: User;
  onSave: (userData: any) => void;
  onCancel: () => void;
}> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    role: user.role,
    canAccessLeads: user.canAccessLeads,
    canAccessStudents: user.canAccessStudents,
    canAccessUsers: user.canAccessUsers,
    canAccessDashboard: user.canAccessDashboard,
    isActive: user.isActive
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Edit User</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>
          
          
          <div>
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value as any })}
              options={[
                { value: "team_member", label: "Team Member" },
                { value: "admin", label: "Admin" }
              ]}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
