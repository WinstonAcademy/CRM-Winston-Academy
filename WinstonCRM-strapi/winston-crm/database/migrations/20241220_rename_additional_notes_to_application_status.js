'use strict';

/**
 * Migration to rename additionalNotes field to applicationStatus in students table
 */

module.exports = {
  async up(knex) {
    // Check if the column exists before trying to rename it
    const hasColumn = await knex.schema.hasColumn('students', 'additionalNotes');
    
    if (hasColumn) {
      await knex.schema.alterTable('students', (table) => {
        table.renameColumn('additionalNotes', 'applicationStatus');
      });
      console.log('Successfully renamed additionalNotes to applicationStatus');
    } else {
      console.log('Column additionalNotes does not exist, skipping rename');
    }
  },

  async down(knex) {
    // Revert the change if needed
    const hasColumn = await knex.schema.hasColumn('students', 'applicationStatus');
    
    if (hasColumn) {
      await knex.schema.alterTable('students', (table) => {
        table.renameColumn('applicationStatus', 'additionalNotes');
      });
      console.log('Successfully reverted applicationStatus to additionalNotes');
    } else {
      console.log('Column applicationStatus does not exist, skipping revert');
    }
  }
};

