"use client";

import PermissionRoute from "@/components/auth/PermissionRoute";
import { AgenciesMetrics } from "@/components/agencies/AgenciesMetrics";
import AgenciesStatusChart from "@/components/agencies/AgenciesStatusChart";
import { MonthlyAgenciesChart } from "@/components/agencies/MonthlyAgenciesChart";
import { AgenciesDemographic } from "@/components/agencies/AgenciesDemographic";

export default function AgenciesDashboardPage() {
    const lastUpdated = new Date().toLocaleString();

    return (
        <PermissionRoute requiredPermission="dashboard">
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 p-6">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                Agencies Dashboard
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Overview of agency partnerships and performance.
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Last updated: {lastUpdated}
                            </p>
                        </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="mb-8">
                        <AgenciesMetrics />
                    </div>

                    {/* Monthly Agencies Chart - Full Width */}
                    <div className="mb-8">
                        <MonthlyAgenciesChart />
                    </div>

                    {/* Status Chart - Full Width */}
                    <div className="mb-8">
                        <AgenciesStatusChart />
                    </div>

                    {/* Geographic Distribution - Full Width */}
                    <div className="mb-8">
                        <AgenciesDemographic />
                    </div>
                </div>
            </div>
        </PermissionRoute>
    );
}
