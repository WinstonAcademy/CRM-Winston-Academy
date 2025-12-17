"use client";

import React, { useState, useEffect, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ClientOnly: React.FC<ClientOnlyProps> = ({ 
  children, 
  fallback = <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-full"></div> 
}) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ClientOnly;
