// API Configuration for Winston Academy CRM
export const API_CONFIG = {
  STRAPI_URL: typeof window !== 'undefined'
    ? ''
    : (process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk'),

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
  const base = API_CONFIG.STRAPI_URL;
  const fullPath = `${base}${endpoint}`;

  if (!params || Object.keys(params).length === 0) {
    return fullPath;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, value);
  });

  return `${fullPath}?${searchParams.toString()}`;
};
