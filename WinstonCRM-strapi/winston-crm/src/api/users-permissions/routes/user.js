'use strict';

/**
 * user router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('plugin::users-permissions.user');

const customRoutes = {
  routes: [
    // IMPORTANT: Current user endpoint
    {
      method: 'GET',
      path: '/users/me',
      handler: 'user.me',
      config: {
        prefix: '',
        policies: []
      }
    },
    // Custom permission update route
    {
      method: 'PUT',
      path: '/users/:id/permissions',
      handler: 'user.updatePermissions',
      config: {
        auth: {
          scope: ['authenticated']
        }
      }
    },
    // Custom status toggle route
    {
      method: 'PUT',
      path: '/users/:id/toggle-status',
      handler: 'user.toggleStatus',
      config: {
        auth: {
          scope: ['authenticated']
        }
      }
    },
    // Change password route for authenticated user
    {
      method: 'POST',
      path: '/users/change-password',
      handler: 'user.changePassword',
      config: {
        auth: {
          scope: ['authenticated']
        }
      }
    }
  ]
};

// Merge default routes with custom routes
module.exports = {
  routes: [
    ...customRoutes.routes,
    ...defaultRouter.routes
  ]
};

