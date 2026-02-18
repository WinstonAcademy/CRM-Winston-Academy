import { realBackendAuthService, RealBackendUser } from './realBackendAuthService';

// User type compatible with RealBackendUser for UI components
export type User = RealBackendUser & {
  phone?: string;
  canAccessAgencies?: boolean;
};

class SimpleUserService {
  private readonly BASE_URL = 'http://localhost:1337';

  // Get all users from backend (users-permissions authentication users)
  async getUsers(): Promise<User[]> {
    try {
      console.log('🔄 Fetching authentication users from backend...');

      // Get token from realBackendAuthService
      const token = realBackendAuthService.getCurrentToken();

      if (!token) {
        console.warn('❌ No authentication token available');
        return [];
      }

      // Fetch users-permissions users directly
      const response = await fetch(`${this.BASE_URL}/api/users?populate=role`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Users fetch failed:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();
      const usersArray = Array.isArray(data) ? data : (data.data || data || []);

      console.log('✅ Fetched', usersArray.length, 'users');

      return usersArray.map((user: any): User => ({
        id: user.id,
        documentId: user.documentId || '',
        username: user.username,
        email: user.email,
        provider: user.provider || 'local',
        confirmed: user.confirmed ?? true,
        blocked: user.blocked ?? false,
        createdAt: user.createdAt || user.created_at || new Date().toISOString(),
        updatedAt: user.updatedAt || user.updated_at || new Date().toISOString(),
        publishedAt: user.publishedAt || user.published_at || new Date().toISOString(),
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        role: user.userRole || user.user_role || user.role || 'team_member',
        userRole: user.userRole || user.user_role || user.role || 'team_member',
        canAccessLeads: user.canAccessLeads || user.can_access_leads || false,
        canAccessStudents: user.canAccessStudents || user.can_access_students || false,
        canAccessUsers: user.canAccessUsers || user.can_access_users || false,
        canAccessAgencies: user.canAccessAgencies || user.can_access_agencies || false,
        canAccessDashboard: user.canAccessDashboard !== false && user.can_access_dashboard !== false,
        isActive: !(user.blocked ?? false),
        phone: user.phone || '',
      }));
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      return [];
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const user = realBackendAuthService.getCurrentUser();
    if (!user) return null;

    // Fetch full user details including phone
    try {
      const token = realBackendAuthService.getCurrentToken();
      if (!token) return user as User;

      const response = await fetch(`${this.BASE_URL}/api/users/${user.id}?populate=*`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return {
          ...user,
          phone: userData.phone || userData.phone_number || '',
        } as User;
      }
    } catch (error) {
      console.error('Error fetching current user details:', error);
    }

    return user as User;
  }

  // Get user by ID
  async getUser(id: number): Promise<User | null> {
    try {
      const token = realBackendAuthService.getCurrentToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${this.BASE_URL}/api/users/${id}?populate=*`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const userData = await response.json();
      return this.mapToUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  // Update user profile information
  async updateUserProfile(userId: number, profileData: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: 'admin' | 'team_member';
  }): Promise<User | null> {
    try {
      const token = realBackendAuthService.getCurrentToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Fetch roles to get IDs if role is being updated
      let roleId;
      if (profileData.role) {
        try {
          const rolesResponse = await fetch(`${this.BASE_URL}/api/users-permissions/roles`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (rolesResponse.ok) {
            const roles = await rolesResponse.json();
            // Map 'admin' to 'Authenticated' (or specific admin role if exists) and 'team_member' to 'Authenticated'
            // In a real app, you'd have distinct roles. For now, assuming 'Authenticated' is the base.
            // If you have custom roles 'Admin' and 'Team Member', map them here.

            // Checking for specific roles based on the string
            const targetRole = roles.roles?.find((r: any) =>
              r.name.toLowerCase() === (profileData.role === 'admin' ? 'admin' : 'authenticated')
            ) || roles.roles?.find((r: any) => r.type === 'authenticated');

            if (targetRole) {
              roleId = targetRole.id;
            }
          }
        } catch (error) {
          console.error('Error fetching roles:', error);
        }
      }

      const updatePayload: any = { ...profileData };
      if (roleId) {
        updatePayload.role = roleId;
      }
      // Strapi user controller expects 'userRole' for the custom field if you added one, 
      // but 'role' relationship update requires ID. 
      // UserTable sends 'role' as 'admin' | 'team_member'. 
      // We'll send both: 'role' as ID (for permission relation) and 'userRole' as string (for UI display if custom field exists)
      updatePayload.userRole = profileData.role;

      const response = await fetch(`${this.BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update user profile failed:', { status: response.status, statusText: response.statusText, errorData });
        throw new Error(`Failed to update user profile: ${response.status} ${response.statusText}`);
      }

      const userData = await response.json();
      return this.mapToUser(userData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Update user permissions
  async updateUserPermissions(userId: number, permissions: {
    canAccessLeads?: boolean;
    canAccessStudents?: boolean;
    canAccessUsers?: boolean;
    canAccessAgencies?: boolean;
    canAccessDashboard?: boolean;
    isActive?: boolean;
  }): Promise<User | null> {
    try {
      const token = realBackendAuthService.getCurrentToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Convert isActive to Strapi's built-in blocked field
      // blocked = !isActive (so inactive users are blocked from login)
      const payload: Record<string, any> = { ...permissions };
      if (typeof permissions.isActive === 'boolean') {
        payload.blocked = !permissions.isActive;
        delete payload.isActive;
      }

      const response = await fetch(`${this.BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update user permissions');
      }

      const userData = await response.json();
      return this.mapToUser(userData);
    } catch (error) {
      console.error('Error updating user permissions:', error);
      throw error;
    }
  }

  // Create new user
  async createUser(userData: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'team_member';
    canAccessLeads: boolean;
    canAccessStudents: boolean;
    canAccessUsers: boolean;
    canAccessAgencies: boolean;
    canAccessDashboard: boolean;
    password?: string;
  }): Promise<User> {
    try {
      const token = realBackendAuthService.getCurrentToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Register user via Strapi auth endpoint
      const registerResponse = await fetch(`${this.BASE_URL}/api/auth/local/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          password: userData.password || 'DefaultPass123!',
        }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.error?.message || 'Failed to create user');
      }

      const authData = await registerResponse.json();
      const newUserId = authData.user.id;

      // Update user profile with additional data
      const updateResponse = await fetch(`${this.BASE_URL}/api/users/${newUserId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          userRole: userData.role,
          canAccessLeads: userData.canAccessLeads,
          canAccessStudents: userData.canAccessStudents,
          canAccessUsers: userData.canAccessUsers,
          canAccessAgencies: userData.canAccessAgencies,
          canAccessDashboard: userData.canAccessDashboard,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update user profile');
      }

      const userDataResponse = await updateResponse.json();
      return this.mapToUser(userDataResponse);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Helper method to map API response to User type
  private mapToUser(userData: any): User {
    return {
      id: userData.id,
      documentId: userData.documentId || '',
      username: userData.username,
      email: userData.email,
      provider: userData.provider || 'local',
      confirmed: userData.confirmed ?? true,
      blocked: userData.blocked ?? false,
      createdAt: userData.createdAt || userData.created_at || new Date().toISOString(),
      updatedAt: userData.updatedAt || userData.updated_at || new Date().toISOString(),
      publishedAt: userData.publishedAt || userData.published_at || new Date().toISOString(),
      firstName: userData.firstName || userData.first_name || '',
      lastName: userData.lastName || userData.last_name || '',
      role: userData.userRole || userData.user_role || userData.role || 'team_member',
      userRole: userData.userRole || userData.user_role || userData.role || 'team_member',
      canAccessLeads: userData.canAccessLeads || userData.can_access_leads || false,
      canAccessStudents: userData.canAccessStudents || userData.can_access_students || false,
      canAccessUsers: userData.canAccessUsers || userData.can_access_users || false,
      canAccessAgencies: userData.canAccessAgencies || userData.can_access_agencies || false,
      canAccessDashboard: userData.canAccessDashboard !== false && userData.can_access_dashboard !== false,
      isActive: !(userData.blocked ?? false),
      phone: userData.phone || userData.phone_number || '',
    };
  }

  // Check if current user has permission
  hasPermission(permission: 'leads' | 'students' | 'users' | 'agencies' | 'dashboard'): boolean {
    const currentUser = realBackendAuthService.getCurrentUser();
    if (!currentUser) return false;

    if (currentUser.role === 'admin' || currentUser.userRole === 'admin') return true;

    switch (permission) {
      case 'leads':
        return currentUser.canAccessLeads ?? false;
      case 'students':
        return currentUser.canAccessStudents ?? false;
      case 'users':
        return currentUser.canAccessUsers ?? false;
      case 'agencies':
        // @ts-ignore - Dynamic property access or need to update realBackendUser type
        return currentUser.canAccessAgencies ?? false;
      case 'dashboard':
        return currentUser.canAccessDashboard ?? true;
      default:
        return false;
    }
  }

  // Check if current user is admin
  isAdmin(): boolean {
    const currentUser = realBackendAuthService.getCurrentUser();
    return currentUser?.role === 'admin' || currentUser?.userRole === 'admin' || false;
  }
}

export const simpleUserService = new SimpleUserService();
