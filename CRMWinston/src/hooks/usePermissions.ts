import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) {
      console.log('🔍 usePermissions: No user found');
      return false;
    }

    console.log('🔍 usePermissions: User object:', user);
    console.log('🔍 usePermissions: Checking permission:', permission);
    console.log('🔍 usePermissions: user.role:', user.role);
    console.log('🔍 usePermissions: user.userRole:', user.userRole);

    // Check specific permission (admin users now respect individual permissions)
    switch (permission) {
      case 'leads':
        const canAccessLeads = user.canAccessLeads ?? false;
        console.log('🔍 usePermissions: canAccessLeads:', canAccessLeads);
        return canAccessLeads;
      case 'students':
        const canAccessStudents = user.canAccessStudents ?? false;
        console.log('🔍 usePermissions: canAccessStudents:', canAccessStudents);
        return canAccessStudents;
      case 'users':
        const canAccessUsers = user.canAccessUsers ?? false;
        console.log('🔍 usePermissions: canAccessUsers:', canAccessUsers);
        return canAccessUsers;
      case 'agencies':
        // @ts-ignore
        const canAccessAgencies = user.canAccessAgencies ?? false;
        console.log('🔍 usePermissions: canAccessAgencies:', canAccessAgencies);
        return canAccessAgencies;
      case 'dashboard':
        const canAccessDashboard = user.canAccessDashboard ?? false;
        console.log('🔍 usePermissions: canAccessDashboard:', canAccessDashboard);
        return canAccessDashboard;
      case 'timesheets':
        const canAccessTimesheets = user.canAccessTimesheets ?? false;
        console.log('🔍 usePermissions: canAccessTimesheets:', canAccessTimesheets);
        return canAccessTimesheets;
      default:
        console.log('🔍 usePermissions: Unknown permission:', permission);
        return false;
    }
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Simple permission checks
  const canAccessLeads = () => hasPermission('leads');
  const canAccessStudents = () => hasPermission('students');
  const canAccessUsers = () => hasPermission('users');
  const canAccessAgencies = () => hasPermission('agencies');
  const canAccessDashboard = () => hasPermission('dashboard');
  const canAccessTimesheets = () => hasPermission('timesheets');

  // For backward compatibility with existing code
  const canViewLeads = () => canAccessLeads();
  const canCreateLeads = () => canAccessLeads();
  const canEditLeads = () => canAccessLeads();
  const canDeleteLeads = () => canAccessLeads();
  const canAssignLeads = () => canAccessLeads();

  const canViewStudents = () => canAccessStudents();
  const canCreateStudents = () => canAccessStudents();
  const canEditStudents = () => canAccessStudents();
  const canDeleteStudents = () => canAccessStudents();
  const canAssignStudents = () => canAccessStudents();

  const canViewUsers = () => canAccessUsers();
  const canCreateUsers = () => canAccessUsers();
  const canEditUsers = () => canAccessUsers();
  const canDeleteUsers = () => canAccessUsers();
  const canManageRoles = () => canAccessUsers();

  const canViewAgencies = () => canAccessAgencies();
  const canCreateAgencies = () => canAccessAgencies();
  const canEditAgencies = () => canAccessAgencies();
  const canDeleteAgencies = () => canAccessAgencies();

  const canViewDashboard = () => canAccessDashboard();
  const canViewAnalytics = () => canAccessDashboard();

  const isAdmin = () => user?.role === 'admin';
  const isTeamMember = () => user?.role === 'team_member';

  // Check if admin has full access (all permissions enabled)
  const isAdminWithFullAccess = () => {
    if (!isAdmin()) return false;
    return user?.canAccessLeads &&
      user?.canAccessStudents &&
      user?.canAccessStudents &&
      user?.canAccessUsers &&
      user?.canAccessAgencies &&
      user?.canAccessDashboard;
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessLeads,
    canAccessStudents,
    canAccessUsers,
    canAccessAgencies,
    canAccessDashboard,
    canAccessTimesheets,
    canViewLeads,
    canCreateLeads,
    canEditLeads,
    canDeleteLeads,
    canAssignLeads,
    canViewStudents,
    canCreateStudents,
    canEditStudents,
    canDeleteStudents,
    canAssignStudents,
    canViewUsers,
    canCreateUsers,
    canEditUsers,
    canDeleteUsers,
    canManageRoles,
    canViewAgencies,
    canCreateAgencies,
    canEditAgencies,
    canDeleteAgencies,
    canViewDashboard,
    canViewAnalytics,
    isAdmin,
    isTeamMember,
    isAdminWithFullAccess,
    user
  };
};
