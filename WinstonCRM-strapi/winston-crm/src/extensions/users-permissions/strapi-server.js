const bcrypt = require('bcryptjs');

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

  // ----------------------------------------------------------------------
  // ADD CUSTOM CHANGE PASSWORD CONTROLLER
  // ----------------------------------------------------------------------
  plugin.controllers.user.changePassword = async (ctx) => {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('You must be authenticated to change your password');

      const { password, passwordConfirmation } = ctx.request.body;

      if (!password || !passwordConfirmation) return ctx.badRequest('Password and password confirmation are required');
      if (password !== passwordConfirmation) return ctx.badRequest('Passwords do not match');
      if (password.length < 6) return ctx.badRequest('Password must be at least 6 characters long');

      // Hash the new password manually
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update directly via Entity Service
      await strapi.entityService.update('plugin::users-permissions.user', user.id, {
        data: { password: hashedPassword }
      });

      return ctx.send({ message: 'Password changed successfully' });
    } catch (error) {
      strapi.log.error('Error changing password:', error);
      return ctx.badRequest('Failed to change password');
    }
  };

  // ----------------------------------------------------------------------
  // REGISTER CUSTOM ROUTE
  // ----------------------------------------------------------------------
  plugin.routes['content-api'].routes.unshift({
    method: 'POST',
    path: '/users/change-password',
    handler: 'user.changePassword',
    config: {
      prefix: '',
      policies: []
    }
  });

  return plugin;
};

