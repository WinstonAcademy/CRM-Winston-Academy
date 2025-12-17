/**
 * Fix API Permissions for Authenticated Users
 * 
 * This script configures Strapi to allow authenticated users to access:
 * - Leads API (find, findOne, create, update, delete)
 * - Students API (find, findOne, create, update, delete)
 * - Users API (find, findOne, update)
 */

const fs = require('fs');
const path = require('path');

const STRAPI_DIR = path.join(__dirname, '..', 'WinstonCRM-strapi', 'winston-crm');
const PERMISSIONS_DIR = path.join(STRAPI_DIR, 'src', 'extensions', 'users-permissions', 'config');

console.log('🔧 Fixing API Permissions for Authenticated Users...\n');

// Create the permissions configuration
const permissionsConfig = {
  actions: {
    // Auth endpoints (already configured, but let's be explicit)
    'users-permissions': {
      auth: {
        callback: {
          enabled: true,
          policy: ''
        },
        connect: {
          enabled: true,
          policy: ''
        },
        forgotPassword: {
          enabled: true,
          policy: ''
        },
        resetPassword: {
          enabled: true,
          policy: ''
        },
        emailConfirmation: {
          enabled: true,
          policy: ''
        },
        sendEmailConfirmation: {
          enabled: true,
          policy: ''
        },
        register: {
          enabled: true,
          policy: ''
        }
      },
      user: {
        me: {
          enabled: true,
          policy: ''
        },
        find: {
          enabled: true,
          policy: ''
        },
        findOne: {
          enabled: true,
          policy: ''
        },
        count: {
          enabled: true,
          policy: ''
        },
        create: {
          enabled: true,
          policy: ''
        },
        update: {
          enabled: true,
          policy: ''
        },
        destroy: {
          enabled: true,
          policy: ''
        }
      }
    },
    // Lead API permissions
    'api::lead.lead': {
      find: {
        enabled: true,
        policy: ''
      },
      findOne: {
        enabled: true,
        policy: ''
      },
      create: {
        enabled: true,
        policy: ''
      },
      update: {
        enabled: true,
        policy: ''
      },
      delete: {
        enabled: true,
        policy: ''
      }
    },
    // Student API permissions
    'api::student.student': {
      find: {
        enabled: true,
        policy: ''
      },
      findOne: {
        enabled: true,
        policy: ''
      },
      create: {
        enabled: true,
        policy: ''
      },
      update: {
        enabled: true,
        policy: ''
      },
      delete: {
        enabled: true,
        policy: ''
      }
    },
    // User custom API permissions (if you have a custom user content type)
    'api::user.user': {
      find: {
        enabled: true,
        policy: ''
      },
      findOne: {
        enabled: true,
        policy: ''
      },
      create: {
        enabled: true,
        policy: ''
      },
      update: {
        enabled: true,
        policy: ''
      },
      delete: {
        enabled: true,
        policy: ''
      }
    }
  }
};

// Ensure the directory exists
if (!fs.existsSync(PERMISSIONS_DIR)) {
  fs.mkdirSync(PERMISSIONS_DIR, { recursive: true });
  console.log('✅ Created permissions directory');
}

// Write the permissions file
const permissionsFile = path.join(PERMISSIONS_DIR, 'permissions.json');
fs.writeFileSync(permissionsFile, JSON.stringify(permissionsConfig, null, 2));
console.log('✅ Created permissions.json\n');

// Also update the plugins.ts to ensure users-permissions is properly configured
const pluginsPath = path.join(STRAPI_DIR, 'config', 'plugins.ts');

const pluginsConfig = `export default {
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
  }
};
`;

fs.writeFileSync(pluginsPath, pluginsConfig);
console.log('✅ Updated plugins.ts\n');

console.log('📋 Summary:');
console.log('✅ Configured permissions for authenticated users');
console.log('✅ Enabled access to:');
console.log('   - Leads API (find, findOne, create, update, delete)');
console.log('   - Students API (find, findOne, create, update, delete)');
console.log('   - Users API (find, findOne, create, update, delete)');
console.log('   - Auth endpoints (callback, register, login, etc.)');
console.log('\n🔄 Please restart Strapi for changes to take effect!');
console.log('   cd WinstonCRM-strapi/winston-crm && npm run develop\n');

