"use client";
import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { studentService, Student } from "@/services/studentService";

interface MonthlyData {
  month: string;
  students: number;
}

export const MonthlyStudentsChart = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.fetchStudents();
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyStudents = (): MonthlyData[] => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const currentYear = new Date().getFullYear();
    const monthlyCounts = new Array(12).fill(0);
    
    students.forEach(student => {
      const studentDate = new Date(student.startDate || student.createdAt);
      if (studentDate.getFullYear() === currentYear) {
        const month = studentDate.getMonth();
        monthlyCounts[month]++;
      }
    });
    
    return months.map((month, index) => ({
      month,
      students: monthlyCounts[index]
    }));
  };

  const monthlyData = calculateMonthlyStudents();

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
            onClick={fetchStudents}
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Monthly Students Enrollment
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Student enrollment trends by month
            </p>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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
                itemStyle={{ color: '#10b981', fontWeight: 600 }}
              />
              <Bar 
                dataKey="students" 
                fill="url(#colorGradient)" 
                radius={[8, 8, 0, 0]}
                barSize={40}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Total students enrolled this year: <span className="font-semibold text-gray-900 dark:text-white">
            {monthlyData.reduce((sum, month) => sum + month.students, 0)}
          </span>
        </p>
      </div>
    </div>
  );
};

