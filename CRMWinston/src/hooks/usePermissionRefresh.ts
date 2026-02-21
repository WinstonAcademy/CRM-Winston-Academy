import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

/**
 * Hook that refreshes user permissions when navigating to protected routes
 * This ensures that permission changes are reflected immediately when users navigate
 * Includes throttling to prevent excessive API calls
 */
export const usePermissionRefresh = () => {
  const pathname = usePathname();
  const { refreshUser } = useAuth();
  const lastRefreshTime = useRef<number>(0);
  const THROTTLE_INTERVAL = 30000; // 30 seconds throttle

  useEffect(() => {
    // List of routes that require permission checks
    const protectedRoutes = ['/leads', '/students', '/users', '/leads-dashboard', '/agencies', '/agencies-dashboard'];
    
    // Check if current route is a protected route
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    
    if (isProtectedRoute) {
      const now = Date.now();
      
      // Only refresh if enough time has passed since last refresh
      if (now - lastRefreshTime.current > THROTTLE_INTERVAL) {
        lastRefreshTime.current = now;
        console.log('🔄 Refreshing user permissions due to navigation to protected route:', pathname);
        
        // Refresh user permissions when navigating to protected routes
        refreshUser().catch(error => {
          // Only log network errors, don't show as critical failures
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            console.warn('⚠️ Backend unavailable, skipping permission refresh:', error.message);
          } else {
            console.warn('Failed to refresh user permissions:', error);
          }
        });
      } else {
        console.log('⏳ Skipping permission refresh due to throttling');
      }
    }
  }, [pathname, refreshUser]);
};
