"use client";

import React from 'react';

interface SyncStatusProps {
  className?: string;
}

// Legacy component - password sync is now handled by backend authentication
// This component is kept for backward compatibility but does nothing
const SyncStatus: React.FC<SyncStatusProps> = ({ className = "" }) => {
  // Component is disabled as password sync is now handled by Strapi backend
  // No need to sync passwords as they are stored securely in the backend
  return null;

  // Prevent hydration mismatch
  if (!isClient) {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`fixed bottom-4 right-4 z-50 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors ${className}`}
        title="Show sync status"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[280px] ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Password Sync Status
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Auto Sync:</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${syncStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {syncStatus.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>

        {/* Sync Interval */}
        {syncStatus.isRunning && syncStatus.interval && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Interval:</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {syncStatus.interval / 1000}s
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <button
            onClick={handleToggleSync}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              syncStatus.isRunning
                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800'
                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800'
            }`}
          >
            {syncStatus.isRunning ? 'Stop Sync' : 'Start Sync'}
          </button>
          
          <button
            onClick={handleManualSync}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 rounded-md transition-colors"
          >
            Sync Now
          </button>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
          {syncStatus.isRunning 
            ? 'Passwords sync automatically from backend every 30 seconds'
            : 'Auto sync is disabled. Use manual sync or start auto sync.'
          }
        </div>
      </div>
    </div>
  );
};

export default SyncStatus;
