"use client";

import PermissionRoute from "@/components/auth/PermissionRoute";
import { StudentsMetrics } from "@/components/students/StudentsMetrics";
import { MonthlyStudentsChart } from "@/components/students/MonthlyStudentsChart";
import { CourseStudentsChart } from "@/components/students/CourseStudentsChart";
import { StudentsDemographic } from "@/components/students/StudentsDemographic";

export default function StudentsDashboardPage() {
  const lastUpdated = new Date().toLocaleString();

  return (
    <PermissionRoute requiredPermission="students">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 dark:from-gray-900 dark:to-green-950 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                Students Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive overview of student enrollment and performance.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="mb-8">
            <StudentsMetrics />
          </div>

          {/* Monthly Students Chart - Full Width */}
          <div className="mb-8">
            <MonthlyStudentsChart />
          </div>

          {/* Course Students Chart - Full Width */}
          <div className="mb-8">
            <CourseStudentsChart />
          </div>

          {/* Students Demographic - Full Width */}
          <div className="mb-8">
            <StudentsDemographic />
          </div>
        </div>
      </div>
    </PermissionRoute>
  );
}

