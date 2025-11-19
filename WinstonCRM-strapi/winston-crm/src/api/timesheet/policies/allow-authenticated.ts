export default (policyContext, config, { strapi }) => {
  // Allow if user is authenticated
  if (policyContext.state.user) {
    return true;
  }
  return false;
};
