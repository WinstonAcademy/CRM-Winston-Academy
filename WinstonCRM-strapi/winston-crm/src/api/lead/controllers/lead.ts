/**
 * lead controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lead.lead', ({ strapi }) => ({
  // Override find method to add custom population
  async find(ctx) {
    try {
      const leads = await strapi.entityService.findMany('api::lead.lead', {
        ...ctx.query,
        populate: ['Documents'],
      });

      return {
        data: leads,
        meta: {
          pagination: {
            page: 1,
            pageSize: leads.length,
            pageCount: 1,
            total: leads.length
          }
        }
      };
    } catch (error) {
      ctx.throw(500, 'Error fetching leads');
    }
  },

  // Override findOne method to add custom population
  async findOne(ctx) {
    try {
      const { id } = ctx.params;

      const lead = await strapi.entityService.findOne('api::lead.lead', id, {
        populate: ['Documents'],
      });

      if (!lead) {
        return ctx.notFound('Lead not found');
      }

      return {
        data: lead,
        meta: {}
      };
    } catch (error) {
      ctx.throw(500, 'Error fetching lead');
    }
  },

  // Override create method
  async create(ctx) {
    try {
      const lead = await strapi.entityService.create('api::lead.lead', {
        data: ctx.request.body.data || ctx.request.body,
        populate: ['Documents'],
      });

      return {
        data: lead,
        meta: {}
      };
    } catch (error) {
      console.error('Lead create error details:', error);
      ctx.throw(500, 'Error creating lead');
    }
  },

  // Override update method
  async update(ctx) {
    try {
      const { id } = ctx.params;

      const updatedLead = await strapi.entityService.update('api::lead.lead', id, {
        data: ctx.request.body.data || ctx.request.body,
        populate: ['Documents'],
      });

      return {
        data: updatedLead,
        meta: {}
      };
    } catch (error) {
      ctx.throw(500, 'Error updating lead');
    }
  },

  // Override delete method
  async delete(ctx) {
    try {
      const { id } = ctx.params;

      const lead = await strapi.entityService.findOne('api::lead.lead', id);
      if (!lead) {
        return ctx.notFound('Lead not found');
      }

      const deletedLead = await strapi.entityService.delete('api::lead.lead', id);

      return {
        data: deletedLead,
        meta: {}
      };
    } catch (error) {
      ctx.throw(500, 'Error deleting lead');
    }
  },
}));
