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
      const queryFiltersObj = typeof queryFilters === 'object' && queryFilters !== null ? queryFilters : {};

      // If not admin, only show their own timesheets
      const filters = !isAdmin ? {
        ...queryFiltersObj,
        employee: { id: user.id }
      } : queryFiltersObj;

      const timesheets = await strapi.entityService.findMany('api::timesheet.timesheet', {
        ...ctx.query,
        filters,
        populate: {
          employee: {
            fields: ['id', 'username', 'email', 'firstName', 'lastName', 'workRole']
          }
        }
      });

      // Hide totalHours for non-admin users
      const transformedTimesheets = timesheets.map((timesheet: any) => {
        if (!isAdmin) {
          // Remove totalHours from response for non-admins
          const { totalHours, ...timesheetWithoutHours } = timesheet;
          return timesheetWithoutHours;
        }
        return timesheet;
      });

      return {
        data: transformedTimesheets,
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

      // Get user's full data to check if they're admin (must be done first)
      const userData = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);
      const isAdmin = userData.userRole === 'admin';

      // Validations
      const errors = [];

      // 1. Check required fields
      // For non-admins, only startTime is required (clock in scenario)
      if (!data.date) errors.push('Date is required');
      if (!data.startTime) errors.push('Start time is required');
      // End time is only required for admins or when creating complete timesheet
      if (isAdmin && !data.endTime) {
        errors.push('End time is required');
      }
      // Notes are optional for clock in, required for complete timesheet
      if (isAdmin && (!data.notes || !data.notes.trim())) {
        errors.push('Notes are required');
      }

      // 3. Validate date restrictions for non-admins
      
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

      // For non-admins creating timesheet (clock in), set default values
      if (!isAdmin) {
        // Set default notes if not provided
        if (!data.notes || !data.notes.trim()) {
          data.notes = 'Clocked in';
        }
        // Set default location if not provided
        if (!data.location) {
          data.location = 'Office';
        }
        // Don't require endTime for clock in
        // totalHours will be null until clock out
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
      // For clock in (no endTime), totalHours should be null
      if (timesheetData.endTime) {
        timesheetData.totalHours = calculatedHours;
      } else {
        timesheetData.totalHours = null; // Will be calculated on clock out
      }
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

      // For non-admins, only allow clock out (updating endTime)
      if (!isAdmin) {
        // Check if this is a clock out operation (only endTime is being updated)
        const allowedFields = ['endTime', 'notes', 'location'];
        const providedFields = Object.keys(data).filter(key => data[key] !== undefined);
        const hasUnallowedFields = providedFields.some(field => !allowedFields.includes(field));
        
        if (hasUnallowedFields) {
          return ctx.forbidden('Non-admin users can only clock out. Please use the clock out button.');
        }
      }

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

  // Clock In - Create timesheet with start time only (for non-admins)
  async clockIn(ctx) {
        try {
          // Manual authentication since auth: false bypasses Strapi auth
          let user = ctx.state.user;
          
          if (!user) {
            // Extract JWT token from Authorization header
            const authHeader = ctx.request.header?.authorization || ctx.request.header?.Authorization;
            const authHeaderStr = Array.isArray(authHeader) ? authHeader[0] : authHeader;
            const token = authHeaderStr?.replace(/^Bearer\s+/i, '').trim();
            
            if (!token) {
              console.error('❌ Clock In - No token found');
              return ctx.unauthorized('You must be logged in');
            }
            
            try {
              // Verify JWT token using Strapi's JWT service
              const { getService } = require('@strapi/plugin-users-permissions/server/utils');
              const jwtService = getService('jwt');
              
              const decodedToken = await jwtService.verify(token);
              
              if (!decodedToken || !decodedToken.id) {
                return ctx.unauthorized('Invalid token');
              }
              
              // Get user from database
              user = await strapi.entityService.findOne('plugin::users-permissions.user', decodedToken.id);
              
              if (!user) {
                return ctx.unauthorized('Invalid user');
              }
              
              // Check if user is blocked or inactive
              if (user.blocked || user.isActive === false) {
                return ctx.unauthorized('Your account has been deactivated');
              }
              
              ctx.state.user = user;
              console.log('✅ Clock In - User authenticated via JWT:', user.email, '(ID:', user.id, ')');
            } catch (jwtError) {
              console.error('❌ Clock In - JWT verification failed:', jwtError.message);
              return ctx.unauthorized('Invalid or expired token');
            }
          } else {
            console.log('✅ Clock In - User authenticated:', user.email, '(ID:', user.id, ')');
          }

          // Get user's full data
          const userData = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);
          const isAdmin = userData.userRole === 'admin';

          // Get today's date
          const today = new Date().toISOString().split('T')[0];

          // Check if user already has a timesheet for today with no endTime (already clocked in)
          const existingTimesheet = await strapi.entityService.findMany('api::timesheet.timesheet', {
            filters: {
              employee: { id: user.id },
              date: today,
              endTime: { $null: true }
            },
            limit: 1
          });

          if (existingTimesheet.length > 0) {
            return ctx.badRequest('You are already clocked in today. Please clock out first.');
          }

          // Get current time in HH:mm format
          const now = new Date();
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          const currentTime = `${hours}:${minutes}:00.000`;

          // Get optional data from request body
          const requestData = ctx.request.body.data || ctx.request.body || {};
          const location = requestData.location || 'Office';
          const notes = requestData.notes || 'Clocked in';

          // Create timesheet with start time only
          const timesheetData = {
            date: today,
            startTime: currentTime,
            endTime: null,
            totalHours: null,
            notes: notes,
            location: location,
            employee: user.id
          };

          console.log('🕐 Clock In - Creating timesheet:', timesheetData);

          const timesheet = await strapi.entityService.create('api::timesheet.timesheet', {
            data: timesheetData,
            populate: {
              employee: {
                fields: ['id', 'username', 'email', 'firstName', 'lastName', 'workRole']
              }
            }
          });

          // Remove totalHours from response for non-admins
          if (!isAdmin && timesheet.totalHours !== null && timesheet.totalHours !== undefined) {
            delete timesheet.totalHours;
          }

          console.log('✅ Clock In successful:', timesheet.id);

          return {
            data: timesheet,
            meta: {}
          };
        } catch (error) {
          console.error('Error clocking in:', error);
          ctx.throw(500, error.message || 'Error clocking in');
        }
      },

  // Clock Out - Update timesheet with end time (for non-admins)
  async clockOut(ctx) {
        try {
          // Manual authentication since auth: false bypasses Strapi auth
          let user = ctx.state.user;
          
          if (!user) {
            // Extract JWT token from Authorization header
            const authHeader = ctx.request.header?.authorization || ctx.request.header?.Authorization;
            const authHeaderStr = Array.isArray(authHeader) ? authHeader[0] : authHeader;
            const token = authHeaderStr?.replace(/^Bearer\s+/i, '').trim();
            
            if (!token) {
              console.error('❌ Clock Out - No token found');
              return ctx.unauthorized('You must be logged in');
            }
            
            try {
              // Verify JWT token using Strapi's JWT service
              const { getService } = require('@strapi/plugin-users-permissions/server/utils');
              const jwtService = getService('jwt');
              
              const decodedToken = await jwtService.verify(token);
              
              if (!decodedToken || !decodedToken.id) {
                return ctx.unauthorized('Invalid token');
              }
              
              // Get user from database
              user = await strapi.entityService.findOne('plugin::users-permissions.user', decodedToken.id);
              
              if (!user) {
                return ctx.unauthorized('Invalid user');
              }
              
              // Check if user is blocked or inactive
              if (user.blocked || user.isActive === false) {
                return ctx.unauthorized('Your account has been deactivated');
              }
              
              ctx.state.user = user;
              console.log('✅ Clock Out - User authenticated via JWT:', user.email, '(ID:', user.id, ')');
            } catch (jwtError) {
              console.error('❌ Clock Out - JWT verification failed:', jwtError.message);
              return ctx.unauthorized('Invalid or expired token');
            }
          } else {
            console.log('✅ Clock Out - User authenticated:', user.email, '(ID:', user.id, ')');
          }

          // Get user's full data
          const userData = await strapi.entityService.findOne('plugin::users-permissions.user', user.id);
          const isAdmin = userData.userRole === 'admin';

          // Get today's date
          const today = new Date().toISOString().split('T')[0];

          // Find today's timesheet with no endTime (clocked in but not clocked out)
          const existingTimesheets = await strapi.entityService.findMany('api::timesheet.timesheet', {
            filters: {
              employee: { id: user.id },
              date: today,
              endTime: { $null: true }
            },
            populate: ['employee'],
            limit: 1
          });

          if (existingTimesheets.length === 0) {
            return ctx.badRequest('Please clock in first. No active timesheet found for today.');
          }

          const existingTimesheet = existingTimesheets[0];

          // Get current time in HH:mm format
          const now = new Date();
          const hours = now.getHours().toString().padStart(2, '0');
          const minutes = now.getMinutes().toString().padStart(2, '0');
          const currentTime = `${hours}:${minutes}:00.000`;

          // Calculate total hours
          let calculatedHours = 0;
          if (existingTimesheet.startTime) {
            // Parse time strings - handle both HH:MM and HH:MM:SS.SSS formats
            // Convert to string if it's not already
            const startTimeStr = typeof existingTimesheet.startTime === 'string' 
              ? existingTimesheet.startTime 
              : String(existingTimesheet.startTime);
            const startTimeClean = startTimeStr.split('.')[0];
            const startParts = startTimeClean.split(':');
            
            if (startParts.length >= 2) {
              const startHours = parseInt(startParts[0], 10);
              const startMinutes = parseInt(startParts[1], 10) || 0;
              const endHours = parseInt(hours, 10);
              const endMinutes = parseInt(minutes, 10) || 0;
              
              if (!isNaN(startHours) && !isNaN(startMinutes) && !isNaN(endHours) && !isNaN(endMinutes)) {
                const startTotalMinutes = startHours * 60 + startMinutes;
                const endTotalMinutes = endHours * 60 + endMinutes;
                
                if (endTotalMinutes > startTotalMinutes) {
                  const minutesDiff = endTotalMinutes - startTotalMinutes;
                  const hours = minutesDiff / 60;
                  
                  if (hours <= 24) {
                    calculatedHours = Math.round(hours * 100) / 100;
                  } else {
                    return ctx.badRequest('Total hours cannot exceed 24 hours per day');
                  }
                } else {
                  return ctx.badRequest('End time must be after start time');
                }
              }
            }
          }

          // Get optional data from request body
          const requestData = ctx.request.body.data || ctx.request.body || {};
          const updateData: any = {
            endTime: currentTime,
            totalHours: calculatedHours
          };

          // Allow updating notes and location on clock out
          if (requestData.notes !== undefined) {
            updateData.notes = requestData.notes;
          }
          if (requestData.location !== undefined) {
            updateData.location = requestData.location;
          }

          console.log('🕐 Clock Out - Updating timesheet:', existingTimesheet.id, 'with endTime:', currentTime, 'totalHours:', calculatedHours);

          const updatedTimesheet = await strapi.entityService.update('api::timesheet.timesheet', existingTimesheet.id, {
            data: updateData,
            populate: {
              employee: {
                fields: ['id', 'username', 'email', 'firstName', 'lastName', 'workRole']
              }
            }
          });

          // Remove totalHours from response for non-admins
          if (!isAdmin && updatedTimesheet.totalHours !== null && updatedTimesheet.totalHours !== undefined) {
            delete updatedTimesheet.totalHours;
          }

          console.log('✅ Clock Out successful:', updatedTimesheet.id);

          return {
            data: updatedTimesheet,
            meta: {}
          };
        } catch (error) {
          console.error('Error clocking out:', error);
          ctx.throw(500, error.message || 'Error clocking out');
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

