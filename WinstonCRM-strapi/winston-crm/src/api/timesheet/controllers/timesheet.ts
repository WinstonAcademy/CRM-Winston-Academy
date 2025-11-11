import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::timesheet.timesheet', ({ strapi }) => ({
  // Find timesheets with proper filtering (employees see only their own)
  async find(ctx) {
    try {
      const user = ctx.state.user;
      
      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      // Get user's full data to check if they're admin
      const userData = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);
      const isAdmin = userData.userRole === 'admin';

      let filters = ctx.query.filters || {};

      // If not admin, only show their own timesheets
      if (!isAdmin) {
        filters = {
          ...filters,
          employee: { id: user.id }
        };
      }

      const timesheets = await strapi.entityService.findMany('api::timesheet.timesheet', {
        ...ctx.query,
        filters,
        populate: {
          employee: {
            fields: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        }
      });

      return {
        data: timesheets,
        meta: ctx.query.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      ctx.throw(500, 'Error fetching timesheets');
    }
  },

  // Create timesheet with validations
  async create(ctx) {
    try {
      const user = ctx.state.user;
      
      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const data = ctx.request.body.data || ctx.request.body;

      // Validations
      const errors = [];

      // 1. Check required fields
      if (!data.date) errors.push('Date is required');
      if (!data.startTime) errors.push('Start time is required');
      if (!data.endTime) errors.push('End time is required');
      if (!data.notes || !data.notes.trim()) errors.push('Notes are required');
      if (!data.workRole || !data.workRole.trim()) errors.push('Role/work type is required');

      // 2. Validate date is not in future (only admin can set future dates)
      const userData = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);
      const isAdmin = userData.userRole === 'admin';
      
      if (!isAdmin && data.date) {
        const entryDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (entryDate > today) {
          errors.push('Cannot submit timesheet for future dates');
        }
      }

      // 3. Validate end time is after start time
      if (data.startTime && data.endTime) {
        const start = parseTime(data.startTime);
        const end = parseTime(data.endTime);
        
        if (end <= start) {
          errors.push('End time must be after start time');
        }
        
        // Calculate total hours
        const hours = (end - start) / (1000 * 60 * 60);
        
        // 4. Validate maximum hours per day (24 hours)
        if (hours > 24) {
          errors.push('Total hours cannot exceed 24 hours per day');
        }
        
        data.totalHours = Math.round(hours * 100) / 100; // Round to 2 decimal places
      }

      if (errors.length > 0) {
        return ctx.badRequest('Validation failed', { errors });
      }

      // Set employee to current user (employees can only create their own timesheets)
      data.employee = user.id;

      // Set default date to today if not provided
      if (!data.date) {
        data.date = new Date().toISOString().split('T')[0];
      }

      const timesheet = await strapi.entityService.create('api::timesheet.timesheet', {
        data,
        populate: {
          employee: {
            fields: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        }
      });

      console.log('✅ Timesheet created successfully:', timesheet.id);

      return {
        data: timesheet,
        meta: {}
      };
    } catch (error) {
      console.error('Error creating timesheet:', error);
      ctx.throw(500, error.message || 'Error creating timesheet');
    }
  },

  // Update timesheet with validations
  async update(ctx) {
    try {
      const user = ctx.state.user;
      const { id } = ctx.params;
      
      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      // Get user's full data
      const userData = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);
      const isAdmin = userData.userRole === 'admin';

      // Get the existing timesheet
      const existingTimesheet = await strapi.entityService.findOne('api::timesheet.timesheet', id, {
        populate: ['employee']
      });

      if (!existingTimesheet) {
        return ctx.notFound('Timesheet not found');
      }

      // Check if user owns this timesheet or is admin
      if (!isAdmin && existingTimesheet.employee.id !== user.id) {
        return ctx.forbidden('You can only edit your own timesheets');
      }

      const data = ctx.request.body.data || ctx.request.body;

      // Validation (same as create)
      const errors = [];

      if (data.startTime && data.endTime) {
        const start = parseTime(data.startTime);
        const end = parseTime(data.endTime);
        
        if (end <= start) {
          errors.push('End time must be after start time');
        }
        
        const hours = (end - start) / (1000 * 60 * 60);
        
        if (hours > 24) {
          errors.push('Total hours cannot exceed 24 hours per day');
        }
        
        data.totalHours = Math.round(hours * 100) / 100;
      }

      if (errors.length > 0) {
        return ctx.badRequest('Validation failed', { errors });
      }

      // Only admin can change the date
      if (!isAdmin && data.date && data.date !== existingTimesheet.date) {
        return ctx.forbidden('Only admins can change the timesheet date');
      }

      const updatedTimesheet = await strapi.entityService.update('api::timesheet.timesheet', id, {
        data,
        populate: {
          employee: {
            fields: ['id', 'username', 'email', 'firstName', 'lastName']
          }
        }
      });

      return {
        data: updatedTimesheet,
        meta: {}
      };
    } catch (error) {
      console.error('Error updating timesheet:', error);
      ctx.throw(500, 'Error updating timesheet');
    }
  },

  // Delete timesheet (own or admin)
  async delete(ctx) {
    try {
      const user = ctx.state.user;
      const { id } = ctx.params;
      
      if (!user) {
        return ctx.unauthorized('You must be logged in');
      }

      const userData = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);
      const isAdmin = userData.userRole === 'admin';

      const timesheet = await strapi.entityService.findOne('api::timesheet.timesheet', id, {
        populate: ['employee']
      });

      if (!timesheet) {
        return ctx.notFound('Timesheet not found');
      }

      // Check permissions
      if (!isAdmin && timesheet.employee.id !== user.id) {
        return ctx.forbidden('You can only delete your own timesheets');
      }

      const deletedTimesheet = await strapi.entityService.delete('api::timesheet.timesheet', id);

      return {
        data: deletedTimesheet,
        meta: {}
      };
    } catch (error) {
      console.error('Error deleting timesheet:', error);
      ctx.throw(500, 'Error deleting timesheet');
    }
  }
}));

// Helper function to parse time string (HH:MM) to Date object for comparison
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

