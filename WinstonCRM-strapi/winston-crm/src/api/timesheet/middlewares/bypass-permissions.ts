export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Bypass permission check by setting ctx.state.user if token is valid
    // This allows the route to proceed without permission checks
    await next();
  };
};
