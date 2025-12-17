"use client";
import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LeadsService, Lead } from "@/services/leadsService";

interface CourseData {
  course: string;
  total: number;
  newLeads: number;
  contacted: number;
  potential: number;
  students: number;
  notInterested: number;
}

export const CourseLeadsChart = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('All Courses');
  
  const courses = [
    'All Courses',
    'General English',
    'Level 3 Business Management',
    'Level 3 Law',
    'Level 3 Health and Social Care',
    'Level 3 Information Technology'
  ];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await LeadsService.getLeads({ 
        populate: '*',
        pagination: { page: 1, pageSize: 1000 }
      });
      
      if (response && response.data && Array.isArray(response.data)) {
        setLeads(response.data);
      } else {
        console.warn('Unexpected response structure:', response);
        setLeads([]);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError('Failed to fetch leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateCourseLeads = (): CourseData[] => {
    const allCourses = [
      "General English",
      "Level 3 Business Management",
      "Level 3 Law",
      "Level 3 Health and Social Care",
      "Level 3 Information Technology"
    ];

    // Filter courses based on selected filter
    const coursesToShow = selectedCourse === 'All Courses' 
      ? allCourses 
      : [selectedCourse];

    return coursesToShow.map(course => {
      const courseLeads = leads.filter(lead => {
        const leadCourse = (lead as any).Courses || (lead as any).attributes?.Courses;
        return leadCourse === course;
      });

      const total = courseLeads.length;
      const newLeads = courseLeads.filter(lead => {
        const status = (lead as any).LeadStatus || (lead as any).attributes?.LeadStatus;
        return status === 'New Lead';
      }).length;
      
      const contacted = courseLeads.filter(lead => {
        const status = (lead as any).LeadStatus || (lead as any).attributes?.LeadStatus;
        return status === 'Contacted';
      }).length;
      
      const potential = courseLeads.filter(lead => {
        const status = (lead as any).LeadStatus || (lead as any).attributes?.LeadStatus;
        return status === 'Potential Student';
      }).length;
      
      const students = courseLeads.filter(lead => {
        const status = (lead as any).LeadStatus || (lead as any).attributes?.LeadStatus;
        return status === 'Student ';
      }).length;
      
      const notInterested = courseLeads.filter(lead => {
        const status = (lead as any).LeadStatus || (lead as any).attributes?.LeadStatus;
        return status === 'Not Interested';
      }).length;

      return {
        course,
        total,
        newLeads,
        contacted,
        potential,
        students,
        notInterested
      };
    });
  };

  const courseData = calculateCourseLeads();

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
            onClick={fetchLeads}
            className="ml-auto rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getGridCols = () => {
    if (courseData.length === 1) return 'grid-cols-1';
    if (courseData.length === 2) return 'grid-cols-2';
    if (courseData.length === 3) return 'grid-cols-3';
    if (courseData.length === 4) return 'grid-cols-4';
    return 'grid-cols-5';
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 p-6 shadow-sm">
      {/* Header with Filter */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Course Leads by Status
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Performance breakdown by course
              </p>
            </div>
          </div>
          {/* Course Filter */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-transparent border-none text-gray-700 dark:text-gray-300 text-sm font-medium focus:outline-none focus:ring-0 cursor-pointer min-w-[160px]"
            >
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Course Cards - Professional Grid Layout */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Course Performance</h4>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className={`grid ${getGridCols()} gap-4`}>
              {courseData.map((course) => (
                <div 
                  key={course.course} 
                  className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600"
                >
                  <div className="p-5">
                    {/* Course Name */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 line-clamp-2 min-h-[2.5rem] leading-snug">
                        {course.course}
                      </h4>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {course.total}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Leads</span>
                      </div>
                    </div>
                    
                    {/* Status Breakdown - Professional Style */}
                    <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium">New</span>
                        </div>
                        <span className="text-gray-900 dark:text-white font-semibold">{course.newLeads}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Contacted</span>
                        </div>
                        <span className="text-gray-900 dark:text-white font-semibold">{course.contacted}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Potential</span>
                        </div>
                        <span className="text-gray-900 dark:text-white font-semibold">{course.potential}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Students</span>
                        </div>
                        <span className="text-gray-900 dark:text-white font-semibold">{course.students}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          <span className="text-gray-600 dark:text-gray-400 font-medium">Not Interested</span>
                        </div>
                        <span className="text-gray-900 dark:text-white font-semibold">{course.notInterested}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Section - Professional Design */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Status Breakdown</h4>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>
            
            <div className="h-96 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <defs>
                    <linearGradient id="colorNewLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.9}/>
                    </linearGradient>
                    <linearGradient id="colorContacted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.9}/>
                    </linearGradient>
                    <linearGradient id="colorPotential" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0.9}/>
                    </linearGradient>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.9}/>
                    </linearGradient>
                    <linearGradient id="colorNotInterested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.9}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="course" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                    width={50}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      padding: '12px'
                    }}
                    labelStyle={{ fontWeight: '600', color: '#374151', marginBottom: '8px', fontSize: '13px' }}
                    itemStyle={{ fontWeight: 500, fontSize: '12px' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={40}
                    wrapperStyle={{
                      paddingBottom: '15px'
                    }}
                    iconType="circle"
                    iconSize={8}
                  />
                  
                  <Bar 
                    dataKey="newLeads" 
                    name="New Leads"
                    fill="url(#colorNewLeads)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="contacted" 
                    name="Contacted"
                    fill="url(#colorContacted)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="potential" 
                    name="Potential"
                    fill="url(#colorPotential)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="students" 
                    name="Students"
                    fill="url(#colorStudents)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="notInterested" 
                    name="Not Interested"
                    fill="url(#colorNotInterested)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
