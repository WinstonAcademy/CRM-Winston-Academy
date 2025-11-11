'use strict';

/**
 * user controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('plugin::users-permissions.user', ({ strapi }) => ({
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

  // Public method to get all users for frontend sync
  async getPublicUsers(ctx) {
    try {
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        populate: ['role'],
      });

      // Transform the data to match frontend expectations
      const transformedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        userRole: user.role?.name || 'team_member',
        canAccessLeads: user.canAccessLeads || false,
        canAccessStudents: user.canAccessStudents || false,
        canAccessUsers: user.canAccessUsers || false,
        canAccessDashboard: user.canAccessDashboard || false,
        isActive: user.isActive !== false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      return { data: transformedUsers };
    } catch (error) {
      strapi.log.error('Error getting public users:', error);
      throw error;
    }
  },
}));
