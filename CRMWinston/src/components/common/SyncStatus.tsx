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
};

export default SyncStatus;
