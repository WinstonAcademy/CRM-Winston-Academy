'use strict';

/**
 * Custom auth controller
 * Extends default Strapi authentication to check custom isActive field
 */

const utils = require('@strapi/utils');
const { getService } = require('@strapi/plugin-users-permissions/server/utils');
const { sanitize } = utils;
const { ApplicationError, ValidationError } = utils.errors;

module.exports = ({ strapi }) => ({
  async callback(ctx) {
    const provider = ctx.params.provider || 'local';
    const params = ctx.request.body;

    const store = strapi.store({ type: 'plugin', name: 'users-permissions' });
    const grantSettings = await store.get({ key: 'grant' });

    const grantProvider = provider === 'local' ? 'email' : provider;

    if (!grantSettings[grantProvider]?.enabled) {
      throw new ApplicationError('This provider is disabled');
    }

    if (provider === 'local') {
      await validateCallbackBody(params);

      const { identifier } = params;

      // Check if is an email
      const isEmail = /^.+@.+\..+$/.test(identifier);

      if (isEmail) {
        params.identifier = identifier.toLowerCase();
      }

      const query = { provider };

      if (isEmail) {
        query.email = params.identifier;
      } else {
        query.username = params.identifier;
      }

      // Find user
      const user = await strapi.query('plugin::users-permissions.user').findOne({ where: query });

      if (!user) {
        throw new ValidationError('Invalid identifier or password');
      }

      if (!user.password) {
        throw new ValidationError('Invalid identifier or password');
      }

      const validPassword = await getService('user').validatePassword(
        params.password,
        user.password
      );

      if (!validPassword) {
        throw new ValidationError('Invalid identifier or password');
      }

      // ⭐ CUSTOM CHECK: Verify user is active
      if (user.isActive === false) {
        console.log('❌ Login blocked: User is inactive:', user.email);
        throw new ApplicationError('Your account has been deactivated. Please contact an administrator.');
      }

      // ⭐ Also check the built-in blocked field
      if (user.blocked) {
        throw new ApplicationError('Your account has been blocked. Please contact an administrator.');
      }

      // ⭐ Check if user is confirmed (if email confirmation is enabled)
      const advancedSettings = await store.get({ key: 'advanced' });
      if (advancedSettings.email_confirmation && !user.confirmed) {
        throw new ApplicationError('Your account email is not confirmed');
      }

      console.log('✅ Login successful for user:', user.email, '(isActive:', user.isActive, ')');

      ctx.send({
        jwt: getService('jwt').issue({ id: user.id }),
        user: await sanitize.contentAPI.output(user, strapi.getModel('plugin::users-permissions.user')),
      });
    } else {
      // Redirect to the front-end with the access_token
      return ctx.redirect(
        `${grantSettings[grantProvider].redirectUri}?access_token=${accessToken}`
      );
    }
  },
});

const validateCallbackBody = async (data) => {
  if (!data.identifier) {
    throw new ValidationError('Missing identifier');
  }

  if (!data.password) {
    throw new ValidationError('Missing password');
  }
};

