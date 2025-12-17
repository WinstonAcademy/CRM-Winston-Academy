"use client";

import { useState, useEffect } from "react";
import { buildApiUrl } from "@/config/api";

export default function APIDebugger() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runDebugTests = async () => {
      const info: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          NEXT_PUBLIC_STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL,
        },
        config: {
          STRAPI_URL: buildApiUrl(''),
          LEADS_ENDPOINT: buildApiUrl('/api/leads'),
        },
        tests: {}
      };

      // Test 1: Basic fetch to Strapi
      try {
        const response = await fetch(buildApiUrl('/api/leads', { populate: '*' }));
        info.tests.basicFetch = {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        };
        
        if (response.ok) {
          const data = await response.json();
          info.tests.basicFetch.data = {
            count: data.data?.length || 0,
            sample: data.data?.[0] || null
          };
        }
      } catch (error) {
        info.tests.basicFetch = {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        };
      }

      // Test 2: Check CORS
      try {
        const corsResponse = await fetch(buildApiUrl('/api/leads'), {
          method: 'OPTIONS'
        });
        info.tests.cors = {
          status: corsResponse.status,
          ok: corsResponse.ok,
          headers: Object.fromEntries(corsResponse.headers.entries())
        };
      } catch (error) {
        info.tests.cors = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      setDebugInfo(info);
      setIsLoading(false);
    };

    runDebugTests();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="animate-pin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">Running API tests...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        API Debug Information
      </h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Environment & Configuration
          </h4>
          <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded border overflow-auto">
            {JSON.stringify(debugInfo.environment, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API URLs
          </h4>
          <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded border overflow-auto">
            {JSON.stringify(debugInfo.config, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Results
          </h4>
          <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded border overflow-auto">
            {JSON.stringify(debugInfo.tests, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

