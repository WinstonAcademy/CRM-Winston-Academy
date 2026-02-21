/**
 * Real Backend Authentication Service
 * 
 * This service provides REAL backend authentication using Strapi's users-permissions plugin.
 * No more hardcoded passwords - everything is handled by the backend!
 */

export interface RealBackendUser {
  id: number;
  documentId: string;
  username: string;
  email: string;
  provider: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  // Custom fields (if any)
  firstName?: string;
  lastName?: string;
  userRole?: 'admin' | 'team_member';
  role?: 'admin' | 'team_member' | any; // Can be object (relation) or string - use userRole instead
  phone?: string;
  canAccessLeads?: boolean;
  canAccessStudents?: boolean;
  canAccessUsers?: boolean;
  canAccessDashboard?: boolean;
  canAccessTimesheets?: boolean;
  canAccessAgencies?: boolean;
  isActive?: boolean;
}

export interface LoginCredentials {
  identifier: string; // email or username
  password: string;
}

export interface AuthResponse {
  jwt: string;
  user: RealBackendUser;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  userRole?: 'admin' | 'team_member';
  canAccessLeads?: boolean;
  canAccessStudents?: boolean;
  canAccessUsers?: boolean;
  canAccessDashboard?: boolean;
  canAccessTimesheets?: boolean;
  canAccessAgencies?: boolean;
  isActive?: boolean;
}

class RealBackendAuthService {
  private currentUser: RealBackendUser | null = null;
  private currentToken: string | null = null;
  private readonly BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk');
  private readonly USE_PROXY = typeof window !== 'undefined'; // Use proxy in browser
  private tokenRefreshInterval: NodeJS.Timeout | null = null;
  private readonly TOKEN_REFRESH_CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
  private readonly TOKEN_REFRESH_THRESHOLD = 15 * 60 * 1000; // Refresh if expires in 15 minutes

  constructor() {
    // Load stored user and token on initialization
    this.loadStoredAuth();

    // Start token refresh monitoring if in browser
    if (typeof window !== 'undefined') {
      this.startTokenRefreshMonitoring();
    }
  }

  /**
   * Login with real backend authentication
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 RealBackendAuth: Attempting login with backend authentication...');
      console.log('🔐 RealBackendAuth: Credentials:', { identifier: credentials.identifier });

      // Use Next.js API proxy in browser to avoid CORS issues
      const url = this.USE_PROXY ? '/api/auth/login' : `${this.BASE_URL || 'https://api.crm.winstonacademy.co.uk'}/api/auth/local`;
      console.log('🔐 RealBackendAuth: Using URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('🔐 RealBackendAuth: Response status:', response.status);

      if (!response.ok) {
        let errorData: any = {};
        let errorMessage = 'Login failed';

        try {
          const responseText = await response.text();
          console.log('🔐 RealBackendAuth: Error response text:', responseText);

          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
            } catch (parseError) {
              // If JSON parsing fails, use the raw text
              errorMessage = responseText || 'Login failed';
            }
          }

          // Extract error message from various possible structures
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }

          console.error('❌ RealBackendAuth: Login failed:', errorData);
          console.error('❌ RealBackendAuth: Error message:', errorMessage);

          // Provide user-friendly error messages
          if (errorMessage.includes('blocked') || errorMessage.includes('deactivated')) {
            throw new Error('Your account has been deactivated. Please contact support.');
          } else if (errorMessage.includes('Invalid identifier or password') || errorMessage.includes('Invalid email or password')) {
            throw new Error('Invalid email or password. Please try again.');
          } else if (errorMessage.includes('confirmed')) {
            throw new Error('Please verify your email before logging in.');
          } else {
            throw new Error(errorMessage);
          }
        } catch (error) {
          // If error handling itself fails, throw a generic error
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('Login failed. Please check your credentials and try again.');
        }
      }

      const authData: AuthResponse = await response.json();

      console.log('✅ RealBackendAuth: Login successful with backend authentication');
      console.log('🔑 JWT Token:', authData.jwt.substring(0, 50) + '...');
      console.log('👤 User:', authData.user.email);

      // Fetch complete user data directly from users table (Strapi 5 workaround)
      console.log('🔄 RealBackendAuth: Fetching complete user data from database...');

      // The auth response contains the user ID, use it to fetch full details
      try {
        const userResponse = await fetch(`${this.BASE_URL}/api/users/${authData.user.id}?populate=*`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authData.jwt}`,
            'Content-Type': 'application/json',
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          console.log('✅ RealBackendAuth: Complete user data fetched');

          // Merge the complete user data
          authData.user = {
            ...authData.user,
            ...userData,
            // Ensure custom fields with proper defaults
            userRole: userData.userRole || userData.user_role || 'team_member',
            role: userData.userRole || userData.user_role || 'team_member',
            canAccessLeads: userData.canAccessLeads === true || userData.can_access_leads === true,
            canAccessStudents: userData.canAccessStudents === true || userData.can_access_students === true,
            canAccessUsers: userData.canAccessUsers === true || userData.can_access_users === true,
            canAccessDashboard: userData.canAccessDashboard !== false && userData.can_access_dashboard !== false,
            canAccessTimesheets: userData.canAccessTimesheets !== false && userData.can_access_timesheets !== false,
            canAccessAgencies: userData.canAccessAgencies === true || userData.can_access_agencies === true,
            isActive: !(userData.blocked ?? false),
            firstName: userData.firstName || userData.first_name || '',
            lastName: userData.lastName || userData.last_name || '',
            phone: userData.phone || userData.data?.phone || '',
          };
        } else {
          console.warn('⚠️ RealBackendAuth: User endpoint failed, setting admin defaults for admin users');
          // For admin user, enable all permissions by default
          if (authData.user.email === 'admin@winston.edu' || authData.user.username === 'admin.user') {
            authData.user.canAccessLeads = true;
            authData.user.canAccessStudents = true;
            authData.user.canAccessUsers = true;
            authData.user.canAccessDashboard = true;
            authData.user.canAccessTimesheets = true;
            authData.user.canAccessAgencies = true;
            authData.user.role = 'admin';
            authData.user.userRole = 'admin';
            authData.user.isActive = true;
          } else {
            // For other users, set safe defaults
            authData.user.canAccessLeads = false;
            authData.user.canAccessStudents = false;
            authData.user.canAccessUsers = false;
            authData.user.canAccessDashboard = true;
            authData.user.canAccessTimesheets = true;
            authData.user.canAccessAgencies = false;
            authData.user.role = 'team_member';
            authData.user.isActive = true;
          }
        }
      } catch (error) {
        console.error('❌ RealBackendAuth: Error fetching user data:', error);
        // Fallback to admin defaults for admin user
        if (authData.user.email === 'admin@winston.edu' || authData.user.username === 'admin.user') {
          authData.user.canAccessLeads = true;
          authData.user.canAccessStudents = true;
          authData.user.canAccessUsers = true;
          authData.user.canAccessDashboard = true;
          authData.user.canAccessAgencies = true;
          authData.user.role = 'admin';
          authData.user.userRole = 'admin';
          authData.user.isActive = true;
        }
      }

      // Map userRole to role for compatibility
      if (authData.user.userRole && !authData.user.role) {
        authData.user.role = authData.user.userRole;
      }

      console.log('📋 RealBackendAuth: Final user permissions:', {
        role: authData.user.role,
        canAccessLeads: authData.user.canAccessLeads,
        canAccessStudents: authData.user.canAccessStudents,
        canAccessUsers: authData.user.canAccessUsers,
        canAccessDashboard: authData.user.canAccessDashboard,
      });

      // Store the user and token
      this.currentUser = authData.user;
      this.currentToken = authData.jwt;
      this.storeAuth();

      // Restart token refresh monitoring with new token
      this.startTokenRefreshMonitoring();

      return authData;
    } catch (error) {
      console.error('❌ RealBackendAuth: Login failed:', error);

      // Check if it's a network error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to backend server. Please check your connection.');
      }

      throw error;
    }
  }

  /**
   * Register a new user with real backend authentication
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      console.log('📝 RealBackendAuth: Registering new user with backend authentication...');

      const response = await fetch(`${this.BASE_URL}/api/auth/local/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Registration failed');
      }

      const authData: AuthResponse = await response.json();

      console.log('✅ RealBackendAuth: Registration successful with backend authentication');
      console.log('🔑 JWT Token:', authData.jwt.substring(0, 50) + '...');
      console.log('👤 User:', authData.user.email);

      // Store the user and token
      this.currentUser = authData.user;
      this.currentToken = authData.jwt;
      this.storeAuth();

      // Restart token refresh monitoring with new token
      this.startTokenRefreshMonitoring();

      return authData;
    } catch (error) {
      console.error('❌ RealBackendAuth: Registration failed:', error);
      throw error;
    }
  }

  /**
   * Logout the current user
   */
  logout(): void {
    console.log('🚪 RealBackendAuth: Logging out user...');
    this.currentUser = null;
    this.currentToken = null;
    this.clearStoredAuth();
    this.stopTokenRefreshMonitoring();
  }

  /**
   * Get the current authenticated user
   */
  getCurrentUser(): RealBackendUser | null {
    return this.currentUser;
  }

  /**
   * Get the current JWT token
   */
  getCurrentToken(): string | null {
    // Check if token is expired before returning
    if (this.currentToken && this.isTokenExpired(this.currentToken)) {
      console.warn('⚠️ RealBackendAuth: Token expired, clearing auth');
      this.logout();
      return null;
    }

    return this.currentToken;
  }

  /**
   * Get valid token or throw error if expired
   */
  getValidToken(): string {
    const token = this.getCurrentToken();
    if (!token) {
      throw new Error('No valid authentication token available. Please log in again.');
    }
    return token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.currentUser || !this.currentToken) {
      return false;
    }

    // Check if token is expired
    if (this.isTokenExpired(this.currentToken)) {
      console.warn('⚠️ RealBackendAuth: Token is expired');
      return false;
    }

    return true;
  }

  /**
   * Decode JWT token to get payload
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true; // If we can't decode, assume expired
      }

      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();

      return currentTime >= expirationTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired on error
    }
  }

  /**
   * Get token expiration time in milliseconds
   */
  private getTokenExpirationTime(token: string): number | null {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return null;
      }
      return decoded.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token needs refresh (expires soon)
   */
  private shouldRefreshToken(token: string): boolean {
    const expirationTime = this.getTokenExpirationTime(token);
    if (!expirationTime) {
      return true; // Can't determine, try to refresh
    }

    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;

    // Refresh if token expires within the threshold
    return timeUntilExpiration < this.TOKEN_REFRESH_THRESHOLD;
  }

  /**
   * Refresh token by re-authenticating (Strapi doesn't have refresh tokens)
   */
  async refreshToken(): Promise<boolean> {
    if (!this.currentUser || !this.currentToken) {
      console.log('⚠️ RealBackendAuth: No user or token to refresh');
      return false;
    }

    // Check if token is already expired
    if (this.isTokenExpired(this.currentToken)) {
      console.log('⚠️ RealBackendAuth: Token already expired, cannot refresh');
      this.logout();
      return false;
    }

    // For Strapi, we can't refresh without password, so we just refresh user data
    // The token will remain valid until it expires
    // In a production system, you'd want to implement a refresh token mechanism
    console.log('🔄 RealBackendAuth: Token refresh check - token still valid');

    // Refresh user data to ensure we have latest permissions
    await this.refreshUser();

    return true;
  }

  /**
   * Start monitoring token expiration and refresh when needed
   */
  private startTokenRefreshMonitoring(): void {
    // Clear any existing interval
    this.stopTokenRefreshMonitoring();

    // Check token expiration periodically
    this.tokenRefreshInterval = setInterval(async () => {
      if (!this.currentToken) {
        return;
      }

      // Check if token is expired
      if (this.isTokenExpired(this.currentToken)) {
        console.log('⚠️ RealBackendAuth: Token expired, logging out');
        this.logout();
        return;
      }

      // Check if token needs refresh
      if (this.shouldRefreshToken(this.currentToken)) {
        console.log('🔄 RealBackendAuth: Token expires soon, attempting refresh...');
        await this.refreshToken();
      }
    }, this.TOKEN_REFRESH_CHECK_INTERVAL);

    console.log('✅ RealBackendAuth: Token refresh monitoring started');
  }

  /**
   * Stop token refresh monitoring
   */
  private stopTokenRefreshMonitoring(): void {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
      console.log('🛑 RealBackendAuth: Token refresh monitoring stopped');
    }
  }

  /**
   * Refresh user data from backend
   */
  async refreshUser(): Promise<RealBackendUser | null> {
    if (!this.currentToken) {
      console.log('⚠️ RealBackendAuth: No token available for refresh');
      return null;
    }

    if (!this.currentUser || !this.currentUser.id) {
      console.log('⚠️ RealBackendAuth: No current user data available for refresh');
      return null;
    }

    try {
      console.log('🔄 RealBackendAuth: Refreshing user data from backend...');

      // Check token before making request
      const token = this.getValidToken();

      // Use the user ID to fetch updated user data (since /api/users/me doesn't exist in Strapi)
      const response = await fetch(`${this.BASE_URL}/api/users/${this.currentUser.id}?populate=*`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('⚠️ RealBackendAuth: Token expired, clearing auth');
          this.logout();
        }
        console.log('❌ RealBackendAuth: Failed to refresh user data');
        return null;
      }

      const responseData = await response.json();
      const userData: RealBackendUser = responseData.data || responseData;

      // Map userRole to role for compatibility
      if (userData.userRole && !userData.role) {
        userData.role = userData.userRole;
      }

      console.log('✅ RealBackendAuth: User data refreshed from backend');
      this.currentUser = userData;
      this.storeAuth();

      return userData;
    } catch (error) {
      console.error('❌ RealBackendAuth: Error refreshing user data:', error);

      // Handle network errors gracefully - don't throw, just return null
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.warn('⚠️ RealBackendAuth: Backend server may be unavailable. Skipping refresh.');
        // Return current user if available, otherwise null
        return this.currentUser;
      }

      return null;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<RealBackendUser[]> {
    const token = this.getValidToken();

    try {
      console.log('📋 RealBackendAuth: Fetching all users from backend...');

      const response = await fetch(`${this.BASE_URL}/api/users-permissions/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      console.log('✅ RealBackendAuth: Users fetched from backend');
      return data;
    } catch (error) {
      console.error('❌ RealBackendAuth: Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: number, profileData: Partial<RealBackendUser>): Promise<RealBackendUser | null> {
    const token = this.getValidToken();

    try {
      console.log('✏️ RealBackendAuth: Updating user profile in backend...');

      const response = await fetch(`${this.BASE_URL}/api/users-permissions/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user profile');
      }

      const updatedUser: RealBackendUser = await response.json();
      console.log('✅ RealBackendAuth: User profile updated in backend');
      return updatedUser;
    } catch (error) {
      console.error('❌ RealBackendAuth: Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Check backend connection (deprecated - not used)
   */
  async checkBackendConnection(): Promise<boolean> {
    // This method is kept for backward compatibility but is no longer used
    return true;
  }

  /**
   * Store authentication data in localStorage
   */
  private storeAuth(): void {
    if (typeof window !== 'undefined') {
      try {
        if (this.currentUser && this.currentToken) {
          // Ensure role field is mapped before storing
          if (this.currentUser.userRole && !this.currentUser.role) {
            this.currentUser.role = this.currentUser.userRole;
          }

          localStorage.setItem('real_backend_user', JSON.stringify(this.currentUser));
          localStorage.setItem('real_backend_token', this.currentToken);
          console.log('💾 RealBackendAuth: Stored user with role:', this.currentUser.role);
        }
      } catch (error) {
        console.error('❌ RealBackendAuth: Error storing auth data:', error);
      }
    }
  }

  /**
   * Load authentication data from localStorage
   */
  private loadStoredAuth(): void {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('real_backend_user');
        const storedToken = localStorage.getItem('real_backend_token');

        if (storedUser && storedToken) {
          // Check if token is expired before loading
          if (this.isTokenExpired(storedToken)) {
            console.log('⚠️ RealBackendAuth: Stored token is expired, clearing auth');
            this.clearStoredAuth();
            return;
          }

          this.currentUser = JSON.parse(storedUser);
          this.currentToken = storedToken;

          // Map userRole to role for compatibility
          if (this.currentUser && this.currentUser.userRole && !this.currentUser.role) {
            this.currentUser.role = this.currentUser.userRole;
          }

          console.log('✅ RealBackendAuth: Loaded stored authentication data');
        }
      } catch (error) {
        console.error('❌ RealBackendAuth: Error loading stored auth data:', error);
        this.clearStoredAuth();
      }
    }
  }

  /**
   * Clear stored authentication data
   */
  private clearStoredAuth(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('real_backend_user');
        localStorage.removeItem('real_backend_token');
      } catch (error) {
        console.error('❌ RealBackendAuth: Error clearing stored auth data:', error);
      }
    }
  }
}

// Export singleton instance
export const realBackendAuthService = new RealBackendAuthService();

