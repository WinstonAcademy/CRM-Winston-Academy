export default {
  'users-permissions': {
    enabled: true,
    config: {
      jwt: {
        expiresIn: '7d',
      },
      register: {
        allowedFields: [
          'firstName',
          'lastName',
          'userRole',
          'canAccessLeads',
          'canAccessStudents',
          'canAccessUsers',
          'canAccessDashboard',
          'isActive',
          'phone'
        ]
      }
    }
  },
  upload: {
    enabled: true,
    config: {
      sizeLimit: 100 * 1024 * 1024, // 100MB
      provider: 'local',
      providerOptions: {
        sizeLimit: 100 * 1024 * 1024, // 100MB
      },
    },
  },
};
