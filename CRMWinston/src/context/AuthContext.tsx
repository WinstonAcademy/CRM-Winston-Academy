"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { realBackendAuthService, RealBackendUser, LoginCredentials } from '../services/realBackendAuthService';
import { userService } from '../services/userService';

// Prevent hydration issues by checking if we're on the client
const isClient = typeof window !== 'undefined';

interface AuthContextType {
  user: RealBackendUser | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<RealBackendUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const initializeAuth = async () => {
      try {
        const storedUser = realBackendAuthService.getCurrentUser();
        if (storedUser) {
          setUser(storedUser);
          
          // No password reset needed for real backend auth
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    
    // Start periodic user permission refresh (every 10 minutes)
    const permissionRefreshInterval = setInterval(async () => {
      console.log('🔄 Real backend auth permission refresh triggered');
      await refreshUser();
    }, 600000); // Refresh every 10 minutes
    
    // Store interval ID for cleanup
    (window as any).permissionRefreshInterval = permissionRefreshInterval;

    // Cleanup on unmount
    return () => {
      // Clear permission refresh interval
      if ((window as any).permissionRefreshInterval) {
        clearInterval((window as any).permissionRefreshInterval);
        (window as any).permissionRefreshInterval = null;
      }
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const authResponse = await realBackendAuthService.login(credentials);
      setUser(authResponse.user);
      
      // No password reset needed for real backend auth
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out user...');
    realBackendAuthService.logout();
    setUser(null);
    console.log('AuthContext: User state cleared, logout complete');
  };

  const refreshUser = async () => {
    if (!realBackendAuthService.isAuthenticated()) {
      return;
    }
    try {
      const updatedUser = await realBackendAuthService.refreshUser();
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Authentication') && !error.message.includes('Failed to fetch')) {
        logout();
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
