import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::agency.agency', ({ strapi }) => ({
  // Override find method to get agencies with all data
  async find(ctx) {
    try {
      const agencies = await strapi.entityService.findMany('api::agency.agency', {
        ...ctx.query,
        populate: {
          contracts: true,
          agreements: true
        }
      });
      
      return {
        data: agencies,
        meta: {
          pagination: {
            page: 1,
            pageSize: agencies.length,
            pageCount: 1,
            total: agencies.length
          }
        }
      };
    } catch (error) {
      ctx.throw(500, 'Error fetching agencies');
    }
  },

  // Override findOne method to get agency with all data
  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      
      const agency = await strapi.entityService.findOne('api::agency.agency', id, {
        populate: {
          contracts: true,
          agreements: true
        }
      });
      
      if (!agency) {
        return ctx.notFound('Agency not found');
      }

      return {
        data: agency,
        meta: {}
      };
    } catch (error) {
      ctx.throw(500, 'Error fetching agency');
    }
  },

  // Override create method
  async create(ctx) {
    try {
      console.log('📝 Creating agency with data:', ctx.request.body);
      
      const agency = await strapi.entityService.create('api::agency.agency', {
        data: ctx.request.body.data || ctx.request.body
      });

      console.log('✅ Agency created successfully:', agency);

      return {
        data: agency,
        meta: {}
      };
    } catch (error) {
      console.error('❌ Error creating agency:', error);
      ctx.throw(500, `Error creating agency: ${error.message}`);
    }
  },

  // Override update method
  async update(ctx) {
    try {
      const { id } = ctx.params;
      
      const updatedAgency = await strapi.entityService.update('api::agency.agency', id, {
        data: ctx.request.body.data || ctx.request.body
      });

      return {
        data: updatedAgency,
        meta: {}
      };
    } catch (error) {
      ctx.throw(500, 'Error updating agency');
    }
  },

  // Override delete method
  async delete(ctx) {
    try {
      const { id } = ctx.params;
      
      const agency = await strapi.entityService.findOne('api::agency.agency', id);
      if (!agency) {
        return ctx.notFound('Agency not found');
      }

      const deletedAgency = await strapi.entityService.delete('api::agency.agency', id);
      
      return {
        data: deletedAgency,
        meta: {}
      };
    } catch (error) {
      ctx.throw(500, 'Error deleting agency');
    }
  },
}));

