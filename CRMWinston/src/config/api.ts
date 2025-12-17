// API Configuration for Winston Academy CRM
export const API_CONFIG = {
  // Strapi Backend URL - Uses environment variable, falls back to localhost for development
  STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'http://localhost:1337',
  
  // API Endpoints
  ENDPOINTS: {
    LEADS: '/api/leads',
    USERS: '/api/users',
    COURSES: '/api/courses',
  },
  
  // API Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string>) => {
  const url = new URL(`${API_CONFIG.STRAPI_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  return url.toString();
};
