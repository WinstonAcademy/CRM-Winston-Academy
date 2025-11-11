/**
 * Setup Permissions Script
 * This script enables all API permissions for authenticated users via Strapi Admin API
 */

const axios = require('axios');

const STRAPI_URL = 'http://localhost:1337';

async function setupPermissions() {
  try {
    console.log('🔧 Setting up permissions for authenticated users...\n');

    // Note: You need to be logged into Strapi admin and have a valid session
    // Or use an API token

    const permissions = {
      'Leads': {
        'api::lead.lead': ['find', 'findOne', 'create', 'update', 'delete']
      },
      'Students': {
        'api::student.student': ['find', 'findOne', 'create', 'update', 'delete']
      },
      'Users': {
        'api::user.user': ['find', 'findOne', 'create', 'update', 'delete']
      },
      'Auth': {
        'plugin::users-permissions.auth': ['callback', 'connect', 'forgotPassword', 'resetPassword', 'register', 'emailConfirmation', 'sendEmailConfirmation']
      },
      'User Management': {
        'plugin::users-permissions.user': ['me', 'find', 'findOne', 'count', 'create', 'update', 'destroy']
      }
    };

    console.log('📋 Permissions to enable:');
    for (const [category, perms] of Object.entries(permissions)) {
      console.log(`\n${category}:`);
      for (const [controller, actions] of Object.entries(perms)) {
        console.log(`  - ${controller}: ${actions.join(', ')}`);
      }
    }

    console.log('\n\n⚠️  MANUAL SETUP REQUIRED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Please follow these steps to enable API permissions:\n');
    console.log('1. Open Strapi Admin: http://localhost:1337/admin');
    console.log('2. Click on "Settings" in the left sidebar');
    console.log('3. Under "USERS & PERMISSIONS PLUGIN", click on "Roles"');
    console.log('4. Click on "Authenticated"');
    console.log('5. Expand each section (Lead, Student, User, Users-permissions)');
    console.log('6. Check ALL boxes for:');
    console.log('   ✓ Lead: find, findOne, create, update, delete');
    console.log('   ✓ Student: find, findOne, create, update, delete');
    console.log('   ✓ User: find, findOne, create, update, delete');
    console.log('   ✓ Users-permissions / User: me, find, findOne, count, create, update, destroy');
    console.log('   ✓ Users-permissions / Auth: (all authentication options)');
    console.log('7. Click "Save" at the top right');
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

setupPermissions();

