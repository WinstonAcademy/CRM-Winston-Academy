"use client";
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { month: "Jan", newLeads: 45, contacted: 38, potential: 25, students: 18, notInterested: 7 },
  { month: "Feb", newLeads: 52, contacted: 42, potential: 28, students: 22, notInterested: 8 },
  { month: "Mar", newLeads: 48, contacted: 39, potential: 26, students: 20, notInterested: 6 },
  { month: "Apr", newLeads: 61, contacted: 51, potential: 35, students: 28, notInterested: 9 },
  { month: "May", newLeads: 55, contacted: 47, potential: 32, students: 25, notInterested: 7 },
  { month: "Jun", newLeads: 67, contacted: 58, potential: 42, students: 35, notInterested: 12 },
  { month: "Jul", newLeads: 58, contacted: 49, potential: 33, students: 26, notInterested: 8 },
  { month: "Aug", newLeads: 72, contacted: 62, potential: 45, students: 38, notInterested: 10 },
  { month: "Sep", newLeads: 65, contacted: 56, potential: 38, students: 31, notInterested: 9 },
  { month: "Oct", newLeads: 78, contacted: 68, potential: 48, students: 42, notInterested: 11 },
  { month: "Nov", newLeads: 71, contacted: 61, potential: 41, students: 35, notInterested: 9 },
  { month: "Dec", newLeads: 84, contacted: 73, potential: 52, students: 45, notInterested: 13 },
];

const LeadsConversionChart = () => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Lead Conversion Trends
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monthly lead progression through the sales funnel
          </p>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="newLeads"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              name="New Leads"
            />
            <Line
              type="monotone"
              dataKey="contacted"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
              name="Contacted"
            />
            <Line
              type="monotone"
              dataKey="potential"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
              name="Potential"
            />
            <Line
              type="monotone"
              dataKey="students"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }}
              name="Students"
            />
            <Line
              type="monotone"
              dataKey="notInterested"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
              name="Not Interested"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LeadsConversionChart;

