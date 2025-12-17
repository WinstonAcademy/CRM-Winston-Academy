"use client";
import React from "react";
import { TargetIcon, TrendingUpIcon, UsersIcon, CheckCircleIcon } from "@/icons";

const LeadsTarget = () => {
  const monthlyTarget = 200;
  const currentLeads = 156;
  const conversionRate = 78.5;
  const targetConversion = 85;

  const progressPercentage = (currentLeads / monthlyTarget) * 100;
  const conversionProgress = (conversionRate / targetConversion) * 100;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Monthly Targets
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lead generation and conversion goals
          </p>
        </div>
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center dark:bg-blue-900/20">
          <TargetIcon className="text-blue-600 size-6 dark:text-blue-400" />
        </div>
      </div>

      {/* Lead Generation Target */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Lead Generation
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentLeads} / {monthlyTarget}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {progressPercentage.toFixed(1)}% Complete
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {monthlyTarget - currentLeads} remaining
          </span>
        </div>
      </div>

      {/* Conversion Rate Target */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Conversion Rate
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {conversionRate}% / {targetConversion}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div 
            className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(conversionProgress, 100)}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {conversionProgress.toFixed(1)}% of Target
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {targetConversion - conversionRate}% to go
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg mx-auto mb-2 dark:bg-green-900/20">
            <TrendingUpIcon className="text-green-600 size-4 dark:text-green-400" />
          </div>
          <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {conversionRate}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Current Rate
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg mx-auto mb-2 dark:bg-blue-900/20">
            <UsersIcon className="text-blue-600 size-4 dark:text-blue-400" />
          </div>
          <div className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {currentLeads}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            This Month
          </div>
        </div>
      </div>

      {/* Target Status */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg dark:bg-gray-800/50">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircleIcon className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Target Status
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {progressPercentage >= 100 ? (
            "🎉 Lead generation target achieved! Focus on conversion rate."
          ) : progressPercentage >= 75 ? (
            "🚀 Great progress! On track to meet lead generation target."
          ) : progressPercentage >= 50 ? (
            "📈 Halfway there! Keep up the momentum."
          ) : (
            "💪 Getting started! Focus on lead generation activities."
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadsTarget;

