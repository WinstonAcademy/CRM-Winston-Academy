/**
 * user router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::user.user', {
  config: {
    find: {
      auth: false, // Keep public for now
    },
    findOne: {
      auth: false, // Keep public for now
    },
    create: {
      auth: false, // Keep public for now
    },
    update: {
      auth: false, // Keep public for now
    },
    delete: {
      auth: false, // Keep public for now
    },
  },
  only: ['find', 'findOne', 'create', 'update', 'delete'], // Explicitly include all CRUD operations
});
