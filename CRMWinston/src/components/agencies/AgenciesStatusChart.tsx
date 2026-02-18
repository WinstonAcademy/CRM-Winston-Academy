"use client";
import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { agencyService, Agency } from "@/services/agencyService";

interface ChartData {
    name: string;
    value: number;
    color: string;
}

const AgenciesStatusChart = () => {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [chartData, setChartData] = useState<ChartData[]>([]);

    useEffect(() => {
        fetchAgencies();
    }, []);

    const fetchAgencies = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await agencyService.fetchAgencies();
            setAgencies(data || []);
            processChartData(data || []);
        } catch (error) {
            console.error('Error fetching agencies:', error);
            setError('Failed to fetch agencies');
            setAgencies([]);
        } finally {
            setLoading(false);
        }
    };

    const processChartData = (agenciesData: Agency[]) => {
        const activeCount = agenciesData.filter(a => a.status === 'Active').length;
        const inactiveCount = agenciesData.filter(a => a.status === 'Inactive').length;
        const suspendedCount = agenciesData.filter(a => a.status === 'Suspended').length;

        const data: ChartData[] = [
            { name: "Active", value: activeCount, color: "#10b981" }, // Green
            { name: "Inactive", value: inactiveCount, color: "#9ca3af" }, // Gray
            { name: "Suspended", value: suspendedCount, color: "#f59e0b" }, // Amber/Yellow
        ].filter(item => item.value > 0); // Only show statuses with data

        setChartData(data);
    };

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error Loading Chart</h3>
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm h-80 flex items-center justify-center">
                <div className="h-32 w-32 rounded-full border-4 border-gray-200 border-t-blue-500 animate-spin"></div>
            </div>
        );
    }

    const totalAgencies = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                        Agency Status Distribution
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Current breakdown of agencies by status
                    </p>
                </div>
            </div>

            <div className="h-80 w-full relative">
                {totalAgencies > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                }}
                                formatter={(value: number, name: string) => [value, name]}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        No agency data available
                    </div>
                )}
            </div>

            {/* Additional Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
                        {chartData.find(item => item.name === "Active")?.value || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Active Agencies
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
                        {totalAgencies}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Total Agencies
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgenciesStatusChart;
