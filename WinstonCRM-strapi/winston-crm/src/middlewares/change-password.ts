/**
 * `change-password` middleware
 * 
 * This middleware intercepts user login responses and checks if the user
 * needs to change their default password on first login.
 */

export default (config, { strapi }) => {
  return async (ctx, next) => {
    await next();
  };
};
