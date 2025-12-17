"use client";
import { usePermissionRefresh } from '../../hooks/usePermissionRefresh';

/**
 * Client component that handles permission refresh on route changes
 * This ensures that permission changes are reflected immediately when users navigate
 */
export default function PermissionRefreshHandler() {
  usePermissionRefresh();
  return null; // This component doesn't render anything
}
