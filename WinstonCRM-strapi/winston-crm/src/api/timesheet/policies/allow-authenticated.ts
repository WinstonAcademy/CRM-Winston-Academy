/**
 * Policy that allows any authenticated user to access the route
 * This bypasses permission checks but still requires authentication
 */
export default (policyContext: any, config: any, { strapi }: any) => {
  // If user is authenticated, allow access
  if (policyContext.state.user) {
    return true;
  }
  
  // Otherwise, deny access
  return false;
};

