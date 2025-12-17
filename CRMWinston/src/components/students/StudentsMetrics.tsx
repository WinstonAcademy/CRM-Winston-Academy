"use client";
import React, { useState, useEffect } from "react";
import { studentService, Student } from "@/services/studentService";
import { useRouter } from "next/navigation";

interface Metrics {
  totalStudents: number;
  active: number;
  completed: number;
  suspended: number;
  withdrawn: number;
  newThisMonth: number;
}

export const StudentsMetrics = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    totalStudents: 0,
    active: 0,
    completed: 0,
    suspended: 0,
    withdrawn: 0,
    newThisMonth: 0,
  });
  const router = useRouter();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studentService.fetchStudents();
      setStudents(data || []);
      calculateMetrics(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (studentsData: Student[]) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const newMetrics = {
      totalStudents: studentsData.length,
      active: studentsData.filter(student => student.enrollmentStatus === 'Active').length,
      completed: studentsData.filter(student => student.enrollmentStatus === 'Completed').length,
      suspended: studentsData.filter(student => student.enrollmentStatus === 'Suspended').length,
      withdrawn: studentsData.filter(student => student.enrollmentStatus === 'Withdrawn').length,
      newThisMonth: studentsData.filter(student => {
        const createdDate = new Date(student.createdAt || student.startDate);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }).length,
    };
    setMetrics(newMetrics);
  };

  const navigateToStudentsWithFilter = (status: string) => {
    router.push(`/students?status=${encodeURIComponent(status)}`);
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
            onClick={fetchStudents}
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
      <div className="grid grid-cols-6 gap-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="h-32 rounded-2xl bg-gray-100 animate-pulse dark:bg-gray-800"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-6 gap-4">
      {/* Total Students Card - Gradient Background */}
      <div 
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 p-6 cursor-pointer hover:shadow-lg transition-all duration-300"
        onClick={() => navigateToStudentsWithFilter('all')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
        </div>
        <h3 className="text-sm font-medium text-white/90 mb-2">Total Students</h3>
        <p className="text-3xl font-bold text-white mb-1">{metrics.totalStudents}</p>
        <p className="text-sm text-white/80">All Time</p>
      </div>

      {/* Active Students Card */}
      <div 
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
        onClick={() => navigateToStudentsWithFilter('Active')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/20">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.active}</p>
      </div>

      {/* Completed Students Card */}
      <div 
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
        onClick={() => navigateToStudentsWithFilter('Completed')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/20">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Completed</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.completed}</p>
      </div>

      {/* Suspended Students Card */}
      <div 
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
        onClick={() => navigateToStudentsWithFilter('Suspended')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/20">
            <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Suspended</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.suspended}</p>
      </div>

      {/* Withdrawn Students Card */}
      <div 
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
        onClick={() => navigateToStudentsWithFilter('Withdrawn')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/20">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Withdrawn</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.withdrawn}</p>
      </div>

      {/* New This Month Card */}
      <div 
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
        onClick={() => navigateToStudentsWithFilter('new')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/20">
            <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New This Month</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.newThisMonth}</p>
      </div>
    </div>
  );
};

