'use strict';

/**
 * user router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

const defaultRouter = createCoreRouter('plugin::users-permissions.user');

const customRoutes = {
  routes: [
    // Public users endpoint for frontend sync
    {
      method: 'GET',
      path: '/users/public',
      handler: 'user.getPublicUsers',
      config: {
        auth: false // Make this endpoint public
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
    }
  ]
};

// Merge default routes with custom routes
module.exports = {
  routes: [
    ...defaultRouter.routes,
    ...customRoutes.routes
  ]
};
