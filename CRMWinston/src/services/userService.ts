import { API_CONFIG } from '../config/api';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'admin' | 'manager' | 'supervisor' | 'coordinator' | 'team_member' | 'assistant' | 'intern';
  canAccessLeads: boolean;
  canAccessStudents: boolean;
  canAccessUsers: boolean;
  canAccessDashboard: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'admin' | 'manager' | 'supervisor' | 'coordinator' | 'team_member' | 'assistant' | 'intern';
  canAccessLeads?: boolean;
  canAccessStudents?: boolean;
  canAccessUsers?: boolean;
  canAccessDashboard?: boolean;
  isActive?: boolean;
}

export interface UserPermissions {
  canAccessLeads: boolean;
  canAccessStudents: boolean;
  canAccessUsers: boolean;
  canAccessDashboard: boolean;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'admin' | 'manager' | 'supervisor' | 'coordinator' | 'team_member' | 'assistant' | 'intern';
  canAccessLeads?: boolean;
  canAccessStudents?: boolean;
  canAccessUsers?: boolean;
  canAccessDashboard?: boolean;
  isActive?: boolean;
}

// Default permissions for different roles
export const DEFAULT_PERMISSIONS = {
  admin: {
    canAccessLeads: true,
    canAccessStudents: true,
    canAccessUsers: true,
    canAccessDashboard: true
  },
  manager: {
    canAccessLeads: true,
    canAccessStudents: true,
    canAccessUsers: false,
    canAccessDashboard: true
  },
  supervisor: {
    canAccessLeads: true,
    canAccessStudents: true,
    canAccessUsers: false,
    canAccessDashboard: true
  },
  coordinator: {
    canAccessLeads: true,
    canAccessStudents: false,
    canAccessUsers: false,
    canAccessDashboard: true
  },
  team_member: {
    canAccessLeads: true,
    canAccessStudents: false,
    canAccessUsers: false,
    canAccessDashboard: true
  },
  assistant: {
    canAccessLeads: true,
    canAccessStudents: false,
    canAccessUsers: false,
    canAccessDashboard: false
  },
  intern: {
    canAccessLeads: false,
    canAccessStudents: false,
    canAccessUsers: false,
    canAccessDashboard: false
  }
} as const;

class UserService {
  private baseUrl = `${API_CONFIG.STRAPI_URL}/api`;

  // Get all users
  async getUsers(token: string): Promise<User[]> {
    try {
      const response = await fetch(`${this.baseUrl}/users?populate=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get current user's custom permissions
  async getCurrentUserPermissions(token: string, email: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users?filters[email][$eq]=${email}&populate=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        // Find the specific user by email (in case there are multiple results)
        const user = data.data.find((u: any) => u.email === email);
        return user || data.data[0]; // Return first user if exact match not found
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching current user permissions:', error);
      return null;
    }
  }

  // Get single user
  async getUser(id: number, token: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}?populate=*`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  // Create new user
  async createUser(userData: CreateUserData, token: string): Promise<User> {
    try {
      const defaultPermissions = DEFAULT_PERMISSIONS[userData.role];
      const permissions = {
        canAccessLeads: userData.canAccessLeads ?? defaultPermissions.canAccessLeads,
        canAccessStudents: userData.canAccessStudents ?? defaultPermissions.canAccessStudents,
        canAccessUsers: userData.canAccessUsers ?? defaultPermissions.canAccessUsers,
        canAccessDashboard: userData.canAccessDashboard ?? defaultPermissions.canAccessDashboard,
      };
      
      const response = await fetch(`${this.baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            ...userData,
            ...permissions
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create user');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(id: number, userData: UpdateUserData, token: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: userData
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update user');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(id: number, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Update user permissions
  async updateUserPermissions(id: number, permissions: {
    canAccessLeads: boolean;
    canAccessStudents: boolean;
    canAccessUsers: boolean;
    canAccessDashboard: boolean;
  }, token: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: permissions
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update permissions');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw error;
    }
  }

  // Toggle user active status
  async toggleUserStatus(id: number, isActive: boolean, token: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: { isActive }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update user status');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Get permissions for a role
  getDefaultPermissions(role: 'admin' | 'team_member') {
    return DEFAULT_PERMISSIONS[role];
  }

  // Check if user has permission
  hasPermission(user: User, permission: string): boolean {
    if (user.role === 'admin') return true;
    
    switch (permission) {
      case 'leads':
        return user.canAccessLeads;
      case 'students':
        return user.canAccessStudents;
      case 'users':
        return user.canAccessUsers;
      case 'dashboard':
        return user.canAccessDashboard;
      default:
        return false;
    }
  }
}

export const userService = new UserService();
