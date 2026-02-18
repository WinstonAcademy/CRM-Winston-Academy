"use client";
import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { agencyService, Agency } from "@/services/agencyService";

interface MonthlyData {
    month: string;
    agencies: number;
}

export const MonthlyAgenciesChart = () => {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAgencies();
    }, []);

    const fetchAgencies = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await agencyService.fetchAgencies();
            setAgencies(data || []);
        } catch (error) {
            console.error('Error fetching agencies:', error);
            setError('Failed to fetch agencies');
            setAgencies([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateMonthlyAgencies = (): MonthlyData[] => {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const currentYear = new Date().getFullYear();
        const monthlyCounts = new Array(12).fill(0);

        agencies.forEach(agency => {
            const agencyDate = new Date(agency.createdAt);
            if (agencyDate.getFullYear() === currentYear) {
                const month = agencyDate.getMonth();
                monthlyCounts[month]++;
            }
        });

        return months.map((month, index) => ({
            month,
            agencies: monthlyCounts[index]
        }));
    };

    const monthlyData = calculateMonthlyAgencies();

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                        <span className="text-red-600 text-xl">⚠️</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Chart</h3>
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

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-lg hover:shadow-xl transition-shadow duration-300">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Monthly New Agencies
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            New agencies joined by month
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-80">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 13, fill: '#6b7280', fontWeight: 500 }}
                                tickMargin={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 13, fill: '#6b7280', fontWeight: 500 }}
                                width={50}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '10px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                    padding: '12px'
                                }}
                                labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}
                                itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
                            />
                            <Bar
                                dataKey="agencies"
                                fill="url(#colorGradientAgency)"
                                radius={[8, 8, 0, 0]}
                                barSize={40}
                            />
                            <defs>
                                <linearGradient id="colorGradientAgency" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            <div className="mt-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total new agencies this year: <span className="font-semibold text-gray-900 dark:text-white">
                        {monthlyData.reduce((sum, month) => sum + month.agencies, 0)}
                    </span>
                </p>
            </div>
        </div>
    );
};
