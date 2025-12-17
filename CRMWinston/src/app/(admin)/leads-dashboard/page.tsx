"use client";

import PermissionRoute from "@/components/auth/PermissionRoute";
import { LeadsMetrics } from "@/components/leads/LeadsMetrics";
import { MonthlyLeadsChart } from "@/components/leads/MonthlyLeadsChart";
import { CourseLeadsChart } from "@/components/leads/CourseLeadsChart";
import { LeadsDemographic } from "@/components/leads/LeadsDemographic";

export default function LeadsDashboardPage() {
  const lastUpdated = new Date().toLocaleString();

  return (
    <PermissionRoute requiredPermission="dashboard">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Leads Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive overview of your lead generation and conversion.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="mb-8">
            <LeadsMetrics />
          </div>

          {/* Monthly Leads Chart - Full Width */}
          <div className="mb-8">
            <MonthlyLeadsChart />
          </div>

          {/* Course Leads Chart - Full Width */}
          <div className="mb-8">
            <CourseLeadsChart />
          </div>

          {/* Leads Demographic - Full Width */}
          <div className="mb-8">
            <LeadsDemographic />
          </div>
        </div>
      </div>
    </PermissionRoute>
  );
}
