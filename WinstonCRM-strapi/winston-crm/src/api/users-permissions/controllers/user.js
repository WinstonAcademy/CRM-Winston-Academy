'use strict';

/**
 * user controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
  // IMPORTANT: Get current authenticated user (required for /api/users/me)
  async me(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized();
      }

      // Fetch complete user data with all custom fields
      const userData = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        user.id,
        { populate: ['role'] }
      );

      // Return user data in the format expected by the frontend
      return {
        id: userData.id,
        documentId: userData.documentId,
        username: userData.username,
        email: userData.email,
        provider: userData.provider,
        confirmed: userData.confirmed,
        blocked: userData.blocked,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        // Custom fields
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        userRole: userData.userRole || 'team_member',
        role: userData.userRole || 'team_member',
        canAccessLeads: userData.canAccessLeads || false,
        canAccessStudents: userData.canAccessStudents || false,
        canAccessUsers: userData.canAccessUsers || false,
        canAccessDashboard: userData.canAccessDashboard !== false,
        canAccessTimesheets: userData.canAccessTimesheets !== false,
        canAccessAgencies: userData.canAccessAgencies || false,
        isActive: userData.isActive !== false,
        phone: userData.phone || '',
      };
    } catch (error) {
      strapi.log.error('Error in user me method:', error);
      return ctx.badRequest('Error fetching user data');
    }
  },

  // Custom find method to get all users
  async find(ctx) {
    try {
      const { query } = ctx;

      // Add populate for role relation
      if (!query.populate) {
        query.populate = ['role'];
      }

      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        ...query,
        populate: query.populate,
      });

      return { data: users };
    } catch (error) {
      strapi.log.error('Error in custom user find:', error);
      throw error;
    }
  },

  // Custom findOne method
  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      const { query } = ctx;

      // Add populate for role relation
      if (!query.populate) {
        query.populate = ['role'];
      }

      const user = await strapi.entityService.findOne('plugin::users-permissions.user', id, {
        ...query,
        populate: query.populate,
      });

      return { data: user };
    } catch (error) {
      strapi.log.error('Error in custom user findOne:', error);
      throw error;
    }
  },

  // Custom create method
  async create(ctx) {
    try {
      const { data } = ctx.request.body;

      const user = await strapi.entityService.create('plugin::users-permissions.user', {
        data: {
          ...data,
          confirmed: data.confirmed !== false, // Default to true
          blocked: data.blocked === true, // Default to false
        },
        populate: ['role'],
      });

      return { data: user };
    } catch (error) {
      strapi.log.error('Error in custom user create:', error);
      throw error;
    }
  },

  // Custom update method
  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;

      const user = await strapi.entityService.update('plugin::users-permissions.user', id, {
        data,
        populate: ['role'],
      });

      return { data: user };
    } catch (error) {
      strapi.log.error('Error in custom user update:', error);
      throw error;
    }
  },

  // Custom delete method
  async delete(ctx) {
    try {
      const { id } = ctx.params;

      const user = await strapi.entityService.delete('plugin::users-permissions.user', id);

      return { data: user };
    } catch (error) {
      strapi.log.error('Error in custom user delete:', error);
      throw error;
    }
  },

  // Custom method to update user permissions
  async updatePermissions(ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;

      const user = await strapi.entityService.update('plugin::users-permissions.user', id, {
        data: {
          canAccessLeads: data.canAccessLeads,
          canAccessStudents: data.canAccessStudents,
          canAccessUsers: data.canAccessUsers,
          canAccessDashboard: data.canAccessDashboard,
          canAccessTimesheets: data.canAccessTimesheets,
          canAccessAgencies: data.canAccessAgencies,
        },
        populate: ['role'],
      });

      return { data: user };
    } catch (error) {
      strapi.log.error('Error updating user permissions:', error);
      throw error;
    }
  },

  // Custom method to toggle user status
  async toggleStatus(ctx) {
    try {
      const { id } = ctx.params;

      // Get current user
      const currentUser = await strapi.entityService.findOne('plugin::users-permissions.user', id);

      const user = await strapi.entityService.update('plugin::users-permissions.user', id, {
        data: {
          isActive: !currentUser.isActive,
        },
        populate: ['role'],
      });

      return { data: user };
    } catch (error) {
      strapi.log.error('Error toggling user status:', error);
      throw error;
    }
  },

  // Custom method to change password for authenticated user
  async changePassword(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized('You must be authenticated to change your password');
      }

      const { password, passwordConfirmation } = ctx.request.body;

      if (!password || !passwordConfirmation) {
        return ctx.badRequest('Password and password confirmation are required');
      }

      if (password !== passwordConfirmation) {
        return ctx.badRequest('Passwords do not match');
      }

      if (password.length < 6) {
        return ctx.badRequest('Password must be at least 6 characters long');
      }

      // Update password using Strapi's user service
      await strapi.plugin('users-permissions').service('user').edit(user.id, {
        password,
      });

      return ctx.send({ message: 'Password changed successfully' });
    } catch (error) {
      strapi.log.error('Error changing password:', error);
      return ctx.badRequest('Failed to change password');
    }
  },
}));
