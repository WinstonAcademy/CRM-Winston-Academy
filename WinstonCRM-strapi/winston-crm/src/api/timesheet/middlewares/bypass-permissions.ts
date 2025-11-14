/**
 * Middleware that bypasses permission checks for authenticated users
 * This allows custom routes to work without permission setup
 */
export default (config: any, { strapi }: any) => {
  return async (ctx: any, next: any) => {
    // If user is authenticated, bypass permission check
    if (ctx.state.user) {
      // Set a flag to bypass permission check
      ctx.state.bypassPermissions = true;
    }
    await next();
  };
};

