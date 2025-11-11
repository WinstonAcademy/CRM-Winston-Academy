module.exports = {
  // Before update - sync isActive with blocked field
  async beforeUpdate(event) {
    const { data } = event.params;
    
    // If isActive is being changed, sync it with the blocked field
    if (data.isActive !== undefined) {
      // isActive: false means user should be blocked
      // isActive: true means user should NOT be blocked
      data.blocked = !data.isActive;
      
      console.log(`🔒 User status update: isActive=${data.isActive}, setting blocked=${data.blocked}`);
    }
    
    // Also allow direct blocked field updates
    if (data.blocked !== undefined && data.isActive === undefined) {
      // If blocked is set directly, sync isActive
      data.isActive = !data.blocked;
      console.log(`🔒 User status update: blocked=${data.blocked}, setting isActive=${data.isActive}`);
    }
  },
  
  // Before create - sync isActive with blocked field
  async beforeCreate(event) {
    const { data } = event.params;
    
    // Ensure isActive and blocked are in sync
    if (data.isActive !== undefined && data.blocked === undefined) {
      data.blocked = !data.isActive;
    } else if (data.blocked !== undefined && data.isActive === undefined) {
      data.isActive = !data.blocked;
    } else if (data.isActive === undefined && data.blocked === undefined) {
      // Default both to active/not blocked
      data.isActive = true;
      data.blocked = false;
    }
    
    console.log(`🔒 Creating user with: isActive=${data.isActive}, blocked=${data.blocked}`);
  }
};

