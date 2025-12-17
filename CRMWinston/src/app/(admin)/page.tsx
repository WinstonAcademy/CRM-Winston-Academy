"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";

export default function DashboardPage() {
  const router = useRouter();
  const { canAccessDashboard } = usePermissions();

  useEffect(() => {
    // Redirect to leads dashboard if user has access, otherwise redirect to a default page
    if (canAccessDashboard()) {
      router.replace("/leads-dashboard");
    } else {
      // If user doesn't have dashboard access, redirect to a page they can access
      router.replace("/profile");
    }
  }, [router, canAccessDashboard]);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

