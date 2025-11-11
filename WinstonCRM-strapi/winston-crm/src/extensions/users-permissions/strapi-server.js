module.exports = (plugin) => {
  // Override the local authentication callback
  const originalCallback = plugin.controllers.auth.callback;
  
  plugin.controllers.auth.callback = async (ctx) => {
    // Call the original callback first
    try {
      // For local authentication, check isActive before proceeding
      const provider = ctx.params.provider || 'local';
      
      if (provider === 'local') {
        const { identifier } = ctx.request.body;
        
        // Find the user
        const query = {};
        const isEmail = /^.+@.+\..+$/.test(identifier);
        
        if (isEmail) {
          query.email = identifier.toLowerCase();
        } else {
          query.username = identifier;
        }
        
        query.provider = 'local';
        
        const user = await strapi.query('plugin::users-permissions.user').findOne({ where: query });
        
        if (user) {
          // Check if user is inactive
          if (user.isActive === false) {
            console.log('❌ Login blocked: User is inactive -', user.email);
            return ctx.badRequest('Your account has been deactivated. Please contact an administrator.');
          }
          
          console.log('✅ isActive check passed for user:', user.email);
        }
      }
      
      // Proceed with normal authentication
      await originalCallback(ctx);
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  };

  return plugin;
};

