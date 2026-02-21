"use client";

import { useSidebar } from "@/context/SidebarContext";
import { useEditForm } from "@/context/EditFormContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { isEditFormOpen, isAddFormOpen, isDocumentModalOpen } = useEditForm();

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <ProtectedRoute>
      <div className="min-h-screen xl:flex">
        {/* Sidebar and Backdrop */}
        <AppSidebar />
        <Backdrop />
        {/* Main Content Area */}
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin} min-w-0 overflow-x-hidden`}
        >
          {/* Header - Hidden when any form or modal is open */}
          {!isEditFormOpen && !isAddFormOpen && !isDocumentModalOpen && <AppHeader />}
          {/* Page Content */}
          <div className="p-4 mx-auto max-w-full w-full min-w-0 md:p-6">{children}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
