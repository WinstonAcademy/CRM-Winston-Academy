/**
 * Timesheet Lifecycle Hooks
 * Ensures totalHours is always calculated from startTime and endTime
 */

export default {
  async beforeCreate(event) {
    const { data } = event.params;
    
    // Calculate totalHours if startTime and endTime are provided
    if (data.startTime && data.endTime && (!data.totalHours || data.totalHours === 0)) {
      const startParts = data.startTime.split(':');
      const endParts = data.endTime.split(':');
      
      if (startParts.length >= 2 && endParts.length >= 2) {
        const startHours = parseInt(startParts[0], 10);
        const startMinutes = parseInt(startParts[1], 10);
        const endHours = parseInt(endParts[0], 10);
        const endMinutes = parseInt(endParts[1], 10);
        
        if (!isNaN(startHours) && !isNaN(startMinutes) && !isNaN(endHours) && !isNaN(endMinutes)) {
          const startTotalMinutes = startHours * 60 + startMinutes;
          const endTotalMinutes = endHours * 60 + endMinutes;
          
          if (endTotalMinutes > startTotalMinutes) {
            const minutesDiff = endTotalMinutes - startTotalMinutes;
            const hours = minutesDiff / 60;
            data.totalHours = Math.round(hours * 100) / 100;
            console.log('🔄 Lifecycle: Calculated totalHours:', data.totalHours, 'from', data.startTime, 'to', data.endTime);
          }
        }
      }
    }
  },

  async beforeUpdate(event) {
    const { data } = event.params;
    
    // Recalculate totalHours if startTime or endTime changed
    if (data.startTime && data.endTime) {
      const startParts = data.startTime.split(':');
      const endParts = data.endTime.split(':');
      
      if (startParts.length >= 2 && endParts.length >= 2) {
        const startHours = parseInt(startParts[0], 10);
        const startMinutes = parseInt(startParts[1], 10);
        const endHours = parseInt(endParts[0], 10);
        const endMinutes = parseInt(endParts[1], 10);
        
        if (!isNaN(startHours) && !isNaN(startMinutes) && !isNaN(endHours) && !isNaN(endMinutes)) {
          const startTotalMinutes = startHours * 60 + startMinutes;
          const endTotalMinutes = endHours * 60 + endMinutes;
          
          if (endTotalMinutes > startTotalMinutes) {
            const minutesDiff = endTotalMinutes - startTotalMinutes;
            const hours = minutesDiff / 60;
            data.totalHours = Math.round(hours * 100) / 100;
            console.log('🔄 Lifecycle: Recalculated totalHours:', data.totalHours, 'from', data.startTime, 'to', data.endTime);
          }
        }
      }
    }
  },
};

