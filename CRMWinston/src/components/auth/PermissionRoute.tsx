"use client";

import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface PermissionRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallbackPath?: string;
}

export default function PermissionRoute({ 
  children, 
  requiredPermission, 
  fallbackPath = '/' 
}: PermissionRouteProps) {
  const { hasPermission } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (!hasPermission(requiredPermission)) {
      router.push(fallbackPath);
    }
  }, [hasPermission, requiredPermission, router, fallbackPath]);

  if (!hasPermission(requiredPermission)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access this page.
          </p>
          <button
            onClick={() => router.push(fallbackPath)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
