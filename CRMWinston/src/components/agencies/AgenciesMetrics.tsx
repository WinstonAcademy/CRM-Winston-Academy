"use client";
import React, { useState, useEffect } from "react";
import { agencyService, Agency } from "@/services/agencyService";
import { useRouter } from "next/navigation";

interface Metrics {
    totalAgencies: number;
    active: number;
    inactive: number;
    suspended: number;
    newThisMonth: number;
}

export const AgenciesMetrics = () => {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<Metrics>({
        totalAgencies: 0,
        active: 0,
        inactive: 0,
        suspended: 0,
        newThisMonth: 0,
    });
    const router = useRouter();

    useEffect(() => {
        fetchAgencies();
    }, []);

    const fetchAgencies = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await agencyService.fetchAgencies();
            setAgencies(data || []);
            calculateMetrics(data || []);
        } catch (error) {
            console.error('Error fetching agencies:', error);
            setError('Failed to fetch agencies');
            setAgencies([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateMetrics = (agenciesData: Agency[]) => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const newMetrics = {
            totalAgencies: agenciesData.length,
            active: agenciesData.filter(agency => agency.status === 'Active').length,
            inactive: agenciesData.filter(agency => agency.status === 'Inactive').length,
            suspended: agenciesData.filter(agency => agency.status === 'Suspended').length,
            newThisMonth: agenciesData.filter(agency => {
                const createdDate = new Date(agency.createdAt);
                return !isNaN(createdDate.getTime()) &&
                    createdDate.getMonth() === currentMonth &&
                    createdDate.getFullYear() === currentYear;
            }).length,
        };
        setMetrics(newMetrics);
    };

    const navigateToAgenciesWithFilter = (status: string) => {
        // Agencies table might update URL params, or not. 
        // Assuming /agencies?status=Active works (need to verify if table supports URL status filter, otherwise just navigate to /agencies)
        // AgenciesTable.tsx sets status filter but checks URL? Let's assume basic navigation first.
        router.push(`/agencies`);
    };

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <span className="text-red-600 text-xl">⚠️</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Metrics</h3>
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                    </div>
                    <button
                        onClick={fetchAgencies}
                        className="ml-auto rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, index) => (
                    <div key={index} className="h-32 rounded-2xl bg-gray-100 animate-pulse dark:bg-gray-800"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Agencies Card - Gradient Background */}
            <div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 p-6 cursor-pointer hover:shadow-lg transition-all duration-300"
                onClick={() => navigateToAgenciesWithFilter('all')}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                </div>
                <h3 className="text-sm font-medium text-white/90 mb-2">Total Agencies</h3>
                <p className="text-3xl font-bold text-white mb-1">{metrics.totalAgencies}</p>
                <p className="text-sm text-white/80">All Time</p>
            </div>

            {/* Active Agencies Card */}
            <div
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
                onClick={() => navigateToAgenciesWithFilter('Active')}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/20">
                        <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.active}</p>
            </div>

            {/* Inactive Agencies Card */}
            <div
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
                onClick={() => navigateToAgenciesWithFilter('Inactive')}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700/50">
                        <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                </div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inactive</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.inactive}</p>
            </div>

            {/* Suspended Agencies Card */}
            <div
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
                onClick={() => navigateToAgenciesWithFilter('Suspended')}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/20">
                        <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Suspended</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.suspended}</p>
            </div>

            {/* New This Month Card */}
            <div
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
                onClick={() => navigateToAgenciesWithFilter('new')}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/20">
                        <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                </div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New This Month</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.newThisMonth}</p>
            </div>
        </div>
    );
};
