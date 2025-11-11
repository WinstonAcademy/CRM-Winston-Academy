import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::student.student', ({ strapi }) => ({
  // Override find method to get students with all data
  async find(ctx) {
    try {
      const students = await strapi.entityService.findMany('api::student.student', {
        ...ctx.query,
        populate: {
          lead: {
            populate: ['Documents']
          },
          documents: true
        }
      });
      
      return {
        data: students,
        meta: {
          pagination: {
            page: 1,
            pageSize: students.length,
            pageCount: 1,
            total: students.length
          }
        }
      };
    } catch (error) {
      ctx.throw(500, 'Error fetching students');
    }
  },

  // Override findOne method to get student with all data
  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      
      const student = await strapi.entityService.findOne('api::student.student', id, {
        populate: {
          lead: {
            populate: ['Documents']
          },
          documents: true
        }
      });
      
      if (!student) {
        return ctx.notFound('Student not found');
      }

      return {
        data: student,
        meta: {}
      };
    } catch (error) {
      ctx.throw(500, 'Error fetching student');
    }
  },

  // Override create method
  async create(ctx) {
    try {
      console.log('📝 Creating student with data:', ctx.request.body);
      
      const student = await strapi.entityService.create('api::student.student', {
        data: ctx.request.body.data || ctx.request.body
      });

      console.log('✅ Student created successfully:', student);

      return {
        data: student,
        meta: {}
      };
    } catch (error) {
      console.error('❌ Error creating student:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      ctx.throw(500, `Error creating student: ${error.message}`);
    }
  },

  // Override update method
  async update(ctx) {
    try {
      const { id } = ctx.params;
      
      const updatedStudent = await strapi.entityService.update('api::student.student', id, {
        data: ctx.request.body.data || ctx.request.body
      });

      return {
        data: updatedStudent,
        meta: {}
      };
    } catch (error) {
      ctx.throw(500, 'Error updating student');
    }
  },

  // Override delete method
  async delete(ctx) {
    try {
      const { id } = ctx.params;
      
      const student = await strapi.entityService.findOne('api::student.student', id);
      if (!student) {
        return ctx.notFound('Student not found');
      }

      const deletedStudent = await strapi.entityService.delete('api::student.student', id);
      
      return {
        data: deletedStudent,
        meta: {}
      };
    } catch (error) {
      ctx.throw(500, 'Error deleting student');
    }
  },
})); 