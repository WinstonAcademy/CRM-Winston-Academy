export default {
  routes: [
    {
      method: 'GET',
      path: '/timesheets',
      handler: 'timesheet.find',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/timesheets/:id',
      handler: 'timesheet.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/timesheets',
      handler: 'timesheet.create',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/timesheets/:id',
      handler: 'timesheet.update',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'DELETE',
      path: '/timesheets/:id',
      handler: 'timesheet.delete',
      config: {
        policies: [],
        middlewares: [],
      },
    },
        {
          method: 'POST',
          path: '/timesheets/clock-in',
          handler: 'timesheet.clockIn',
          config: {
            policies: [],
            middlewares: [],
            auth: false, // Bypass permission system, handle auth in controller
          },
        },
        {
          method: 'POST',
          path: '/timesheets/clock-out',
          handler: 'timesheet.clockOut',
          config: {
            policies: [],
            middlewares: [],
            auth: false, // Bypass permission system, handle auth in controller
          },
        },
  ],
};

