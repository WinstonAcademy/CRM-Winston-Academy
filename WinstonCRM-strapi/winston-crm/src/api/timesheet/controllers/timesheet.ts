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

      const queryFilters = ctx.query.filters || {};

      // If not admin, only show their own timesheets
      const filters = !isAdmin ? {
        ...queryFilters,
        employee: { id: user.id }
      } : queryFilters;

      const timesheets = await strapi.entityService.findMany('api::timesheet.timesheet', {
        ...ctx.query,
        filters,
        populate: {
          employee: {
            fields: ['id', 'username', 'email', 'firstName', 'lastName', 'workRole']
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

      // 2. Validate date restrictions for non-admins
      const userData = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);
      const isAdmin = userData.userRole === 'admin';
      
      if (!isAdmin && data.date) {
        const entryDate = new Date(data.date);
        entryDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Non-admins can only submit for today's date
        if (entryDate.getTime() !== today.getTime()) {
          errors.push('You can only submit timesheets for today\'s date. Please contact an admin for previous dates.');
        }
      }

      // 3. Validate end time is after start time and calculate total hours
      let calculatedHours = 0;
      console.log('🔍 Timesheet data received:', JSON.stringify(data, null, 2));
      
      if (data.startTime && data.endTime) {
        console.log('⏰ Calculating hours - Start:', data.startTime, 'End:', data.endTime);
        
        // Parse time strings - handle both HH:MM and HH:MM:SS.SSS formats
        // Remove milliseconds if present (e.g., "09:00:00.000" -> "09:00:00")
        const startTimeClean = data.startTime.split('.')[0];
        const endTimeClean = data.endTime.split('.')[0];
        
        const startParts = startTimeClean.split(':');
        const endParts = endTimeClean.split(':');
        
        if (startParts.length < 2 || endParts.length < 2) {
          errors.push('Invalid time format');
        } else {
          // Parse hours and minutes (ignore seconds if present)
          const startHours = parseInt(startParts[0], 10);
          const startMinutes = parseInt(startParts[1], 10) || 0;
          const endHours = parseInt(endParts[0], 10);
          const endMinutes = parseInt(endParts[1], 10) || 0;
          
          if (isNaN(startHours) || isNaN(startMinutes) || isNaN(endHours) || isNaN(endMinutes)) {
            errors.push('Invalid time values');
          } else {
            // Convert to total minutes for easier calculation
            const startTotalMinutes = startHours * 60 + startMinutes;
            const endTotalMinutes = endHours * 60 + endMinutes;
            
            console.log('⏰ Start:', `${startHours}:${startMinutes.toString().padStart(2, '0')}`, '=', startTotalMinutes, 'minutes');
            console.log('⏰ End:', `${endHours}:${endMinutes.toString().padStart(2, '0')}`, '=', endTotalMinutes, 'minutes');
            
            if (endTotalMinutes <= startTotalMinutes) {
              console.log('❌ End time is not after start time');
              errors.push('End time must be after start time');
            } else {
              // Calculate total hours
              const minutesDiff = endTotalMinutes - startTotalMinutes;
              const hours = minutesDiff / 60;
              console.log('📐 Minutes difference:', minutesDiff, 'minutes =', hours, 'hours');
              
              // 4. Validate maximum hours per day (24 hours)
              if (hours > 24) {
                console.log('❌ Hours exceed 24:', hours);
                errors.push('Total hours cannot exceed 24 hours per day');
              } else {
                // Always calculate and set totalHours (round to 2 decimal places)
                calculatedHours = Math.round(hours * 100) / 100;
                console.log('✅ Calculated total hours:', calculatedHours, 'from', data.startTime, 'to', data.endTime);
              }
            }
          }
        }
      } else {
        console.log('⚠️ Missing start or end time - Start:', data.startTime, 'End:', data.endTime);
      }

      if (errors.length > 0) {
        return ctx.badRequest('Validation failed', { errors });
      }

      // Set employee - admins can set any user, employees can only set themselves
      if (!data.employee) {
        data.employee = user.id; // Default to current user
      } else if (!isAdmin && data.employee !== user.id) {
        // Non-admins cannot set employee to someone else
        return ctx.forbidden('You can only create timesheets for yourself');
      }

      // Set default date to today if not provided
      if (!data.date) {
        data.date = new Date().toISOString().split('T')[0];
      }

      // Remove workRole from data if it exists (it's now in User table) and ensure totalHours is included
      const { workRole, ...timesheetData } = data;
      
      // Convert time format from HH:mm to HH:mm:ss.SSS (Strapi requirement)
      if (timesheetData.startTime && !timesheetData.startTime.includes('.')) {
        const startParts = timesheetData.startTime.split(':');
        if (startParts.length === 2) {
          timesheetData.startTime = `${timesheetData.startTime}:00.000`;
        }
      }
      if (timesheetData.endTime && !timesheetData.endTime.includes('.')) {
        const endParts = timesheetData.endTime.split(':');
        if (endParts.length === 2) {
          timesheetData.endTime = `${timesheetData.endTime}:00.000`;
        }
      }
      
      // Explicitly set totalHours to ensure it's saved
      timesheetData.totalHours = calculatedHours;
      console.log('💾 Final data being saved:', JSON.stringify(timesheetData, null, 2));
      console.log('💾 Saving timesheet with totalHours:', timesheetData.totalHours, '(type:', typeof timesheetData.totalHours, ')');

      const timesheet = await strapi.entityService.create('api::timesheet.timesheet', {
        data: timesheetData,
        populate: {
          employee: {
            fields: ['id', 'username', 'email', 'firstName', 'lastName', 'workRole']
          }
        }
      });

      console.log('✅ Timesheet created successfully:', timesheet.id);
      console.log('📊 Created timesheet totalHours:', timesheet.totalHours, '(type:', typeof timesheet.totalHours, ')');

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
      const existingTimesheet: any = await strapi.entityService.findOne('api::timesheet.timesheet', id, {
        populate: ['employee']
      });

      if (!existingTimesheet) {
        return ctx.notFound('Timesheet not found');
      }

      // Check if user owns this timesheet or is admin
      if (!isAdmin && existingTimesheet.employee?.id !== user.id) {
        return ctx.forbidden('You can only edit your own timesheets');
      }

      const data = ctx.request.body.data || ctx.request.body;

      // Validation (same as create)
      const errors = [];

      let calculatedHours = existingTimesheet.totalHours || 0;
      if (data.startTime && data.endTime) {
        // Parse time strings - handle both HH:MM and HH:MM:SS.SSS formats
        // Remove milliseconds if present (e.g., "09:00:00.000" -> "09:00:00")
        const startTimeClean = data.startTime.split('.')[0];
        const endTimeClean = data.endTime.split('.')[0];
        
        const startParts = startTimeClean.split(':');
        const endParts = endTimeClean.split(':');
        
        if (startParts.length >= 2 && endParts.length >= 2) {
          // Parse hours and minutes (ignore seconds if present)
          const startHours = parseInt(startParts[0], 10);
          const startMinutes = parseInt(startParts[1], 10) || 0;
          const endHours = parseInt(endParts[0], 10);
          const endMinutes = parseInt(endParts[1], 10) || 0;
          
          if (!isNaN(startHours) && !isNaN(startMinutes) && !isNaN(endHours) && !isNaN(endMinutes)) {
            // Convert to total minutes for easier calculation
            const startTotalMinutes = startHours * 60 + startMinutes;
            const endTotalMinutes = endHours * 60 + endMinutes;
            
            if (endTotalMinutes <= startTotalMinutes) {
              errors.push('End time must be after start time');
            } else {
              // Calculate total hours
              const minutesDiff = endTotalMinutes - startTotalMinutes;
              const hours = minutesDiff / 60;
              
              if (hours > 24) {
                errors.push('Total hours cannot exceed 24 hours per day');
              } else {
                // Always calculate and set totalHours (round to 2 decimal places)
                calculatedHours = Math.round(hours * 100) / 100;
                console.log('📊 Updated total hours:', calculatedHours, 'from', minutesDiff, 'minutes');
              }
            }
          }
        }
      } else if (data.startTime || data.endTime) {
        // If only one time is provided, set totalHours to 0
        calculatedHours = 0;
      }

      if (errors.length > 0) {
        return ctx.badRequest('Validation failed', { errors });
      }

      // Only admin can change the date
      if (!isAdmin && data.date && data.date !== existingTimesheet.date) {
        return ctx.forbidden('Only admins can change the timesheet date');
      }

      // Only admin can change the employee
      if (data.employee !== undefined) {
        if (!isAdmin && data.employee !== existingTimesheet.employee?.id) {
          return ctx.forbidden('Only admins can change the timesheet employee');
        }
      }

      // Remove workRole from data if it exists (it's now in User table) and ensure totalHours is included
      const { workRole, ...updateData } = data;
      
      // Convert time format from HH:mm to HH:mm:ss.SSS (Strapi requirement)
      if (updateData.startTime && !updateData.startTime.includes('.')) {
        const startParts = updateData.startTime.split(':');
        if (startParts.length === 2) {
          updateData.startTime = `${updateData.startTime}:00.000`;
        }
      }
      if (updateData.endTime && !updateData.endTime.includes('.')) {
        const endParts = updateData.endTime.split(':');
        if (endParts.length === 2) {
          updateData.endTime = `${updateData.endTime}:00.000`;
        }
      }
      
      // Explicitly set totalHours to ensure it's saved
      updateData.totalHours = calculatedHours;
      console.log('💾 Updating timesheet with totalHours:', updateData.totalHours);

      const updatedTimesheet = await strapi.entityService.update('api::timesheet.timesheet', id, {
        data: updateData,
        populate: {
          employee: {
            fields: ['id', 'username', 'email', 'firstName', 'lastName', 'workRole']
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

      const timesheet: any = await strapi.entityService.findOne('api::timesheet.timesheet', id, {
        populate: ['employee']
      });

      if (!timesheet) {
        return ctx.notFound('Timesheet not found');
      }

      // Check permissions
      if (!isAdmin && timesheet.employee?.id !== user.id) {
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

// Helper function to parse time string (HH:MM or HH:MM:SS) to Date object for comparison
function parseTime(timeString) {
  if (!timeString) {
    console.error('❌ parseTime: Empty time string');
    return new Date();
  }
  
  // Handle both HH:MM and HH:MM:SS formats
  const parts = timeString.split(':');
  if (parts.length < 2) {
    console.error('❌ parseTime: Invalid time format:', timeString);
    return new Date();
  }
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) {
    console.error('❌ parseTime: Invalid hours or minutes:', timeString);
    return new Date();
  }
  
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  console.log('🔧 parseTime: Input:', timeString, '-> Parsed:', hours, 'hours', minutes, 'minutes -> Date:', date.toISOString());
  return date;
}

