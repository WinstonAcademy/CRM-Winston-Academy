"use client";
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
  { name: "New Leads", value: 156, color: "#10b981" },
  { name: "Contacted", value: 892, color: "#8b5cf6" },
  { name: "Potential", value: 634, color: "#f59e0b" },
  { name: "Students", value: 1247, color: "#6366f1" },
  { name: "Not Interested", value: 165, color: "#ef4444" },
];

const LeadsStatusChart = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Lead Status Distribution
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Current breakdown of leads by status
          </p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
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
              formatter={(value, name) => [value, name]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Additional Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {(data.find(item => item.name === "Students")?.value || 0) / (data.reduce((sum, item) => sum + item.value, 0)) * 100}
            %
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Conversion Rate
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-white/90">
            {data.reduce((sum, item) => sum + item.value, 0)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Leads
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsStatusChart;

