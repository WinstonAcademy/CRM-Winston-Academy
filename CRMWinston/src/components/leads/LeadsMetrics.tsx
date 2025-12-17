"use client";
import React, { useState, useEffect } from "react";
import { LeadsService, Lead } from "@/services/leadsService";
import { useRouter } from "next/navigation";

interface Metrics {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  potential: number;
  students: number;
  notInterested: number;
}

export const LeadsMetrics = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    totalLeads: 0,
    newLeads: 0,
    contacted: 0,
    potential: 0,
    students: 0,
    notInterested: 0,
  });
  const router = useRouter();

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
        calculateMetrics(response.data);
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

  const calculateMetrics = (leadsData: Lead[]) => {
    const newMetrics = {
      totalLeads: leadsData.length,
      newLeads: leadsData.filter(lead => {
        const status = (lead as any).LeadStatus || (lead as any).attributes?.LeadStatus;
        return status === 'New Lead';
      }).length,
      contacted: leadsData.filter(lead => {
        const status = (lead as any).LeadStatus || (lead as any).attributes?.LeadStatus;
        return status === 'Contacted';
      }).length,
      potential: leadsData.filter(lead => {
        const status = (lead as any).LeadStatus || (lead as any).attributes?.LeadStatus;
        return status === 'Potential Student';
      }).length,
      students: leadsData.filter(lead => {
        const status = (lead as any).LeadStatus || (lead as any).attributes?.LeadStatus;
        return status === 'Student ';
      }).length,
      notInterested: leadsData.filter(lead => {
        const status = (lead as any).LeadStatus || (lead as any).attributes?.LeadStatus;
        return status === 'Not Interested';
      }).length,
    };
    setMetrics(newMetrics);
  };

  const navigateToLeadsWithFilter = (status: string) => {
    router.push(`/leads?status=${encodeURIComponent(status)}`);
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
            onClick={fetchLeads}
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
      {/* Total Leads Card - Gradient Background */}
      <div 
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 p-6 cursor-pointer hover:shadow-lg transition-all duration-300"
        onClick={() => navigateToLeadsWithFilter('all')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
          </div>
        </div>
        <h3 className="text-sm font-medium text-white/90 mb-2">Total Leads</h3>
        <p className="text-3xl font-bold text-white mb-1">{metrics.totalLeads}</p>
        <p className="text-sm text-white/80">All Time</p>
      </div>

      {/* New Leads Card */}
      <div 
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
        onClick={() => navigateToLeadsWithFilter('New Lead')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/20">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Leads</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.newLeads}</p>
      </div>

      {/* Potential Leads Card */}
      <div 
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
        onClick={() => navigateToLeadsWithFilter('Potential Student')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/20">
            <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Potential</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.potential}</p>
      </div>

      {/* Contacted Leads Card */}
      <div 
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
        onClick={() => navigateToLeadsWithFilter('Contacted')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/20">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contacted</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.contacted}</p>
      </div>

      {/* Students Card */}
      <div 
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
        onClick={() => navigateToLeadsWithFilter('Student ')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/20">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Students</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.students}</p>
      </div>

      {/* Not Interested Card */}
      <div 
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700"
        onClick={() => navigateToLeadsWithFilter('Not Interested')}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/20">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Not Interested</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{metrics.notInterested}</p>
      </div>
    </div>
  );
};
