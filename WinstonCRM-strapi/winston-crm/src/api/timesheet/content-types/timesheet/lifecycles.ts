/**
 * Timesheet Lifecycle Hooks
 * Ensures totalHours is always calculated from startTime and endTime
 */

export default {
  async beforeCreate(event) {
    const { data } = event.params;
    
    // Calculate totalHours if startTime and endTime are provided
    if (data.startTime && data.endTime && (!data.totalHours || data.totalHours === 0)) {
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
          const startTotalMinutes = startHours * 60 + startMinutes;
          const endTotalMinutes = endHours * 60 + endMinutes;
          
          if (endTotalMinutes > startTotalMinutes) {
            const minutesDiff = endTotalMinutes - startTotalMinutes;
            const hours = minutesDiff / 60;
            data.totalHours = Math.round(hours * 100) / 100;
            console.log('🔄 Lifecycle: Calculated totalHours:', data.totalHours, 'from', minutesDiff, 'minutes');
          }
        }
      }
    }
  },

  async beforeUpdate(event) {
    const { data } = event.params;
    
    // Recalculate totalHours if startTime or endTime changed
    if (data.startTime && data.endTime) {
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
          const startTotalMinutes = startHours * 60 + startMinutes;
          const endTotalMinutes = endHours * 60 + endMinutes;
          
          if (endTotalMinutes > startTotalMinutes) {
            const minutesDiff = endTotalMinutes - startTotalMinutes;
            const hours = minutesDiff / 60;
            data.totalHours = Math.round(hours * 100) / 100;
            console.log('🔄 Lifecycle: Recalculated totalHours:', data.totalHours, 'from', minutesDiff, 'minutes');
          }
        }
      }
    }
  },
};

