// import type { Core } from '@strapi/strapi';
import bcrypt from 'bcryptjs';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    console.log('🔧 Setting up API permissions...');

    // Get the Authenticated role
    const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' }
    });

    if (authenticatedRole) {
      console.log('📋 Found Authenticated role:', authenticatedRole.id);

      // Get ALL permissions for authenticated role
      const allPermissions = await strapi.query('plugin::users-permissions.permission').findMany({
        where: {
          role: authenticatedRole.id
        }
      });

      console.log(`📊 Total permissions found: ${allPermissions.length}`);

      // Enable ALL permissions for authenticated users (for development)
      let enabledCount = 0;
      for (const permission of allPermissions) {
        if (!permission.enabled) {
          await strapi.query('plugin::users-permissions.permission').update({
            where: { id: permission.id },
            data: { enabled: true }
          });
          console.log(`✓ Enabled: ${permission.action}`);
          enabledCount++;
        }
      }

      console.log(`✅ API permissions configured successfully! Enabled ${enabledCount} permissions.`);
    } else {
      console.error('❌ Authenticated role not found!');
    }

    // Update existing users to have canAccessTimesheets
    console.log('🔧 Updating users with canAccessTimesheets field...');
    const allUsers = await strapi.query('plugin::users-permissions.user').findMany();
    for (const user of allUsers) {
      if (user.canAccessTimesheets === null || user.canAccessTimesheets === undefined) {
        await strapi.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: { canAccessTimesheets: true }
        });
        console.log(`✓ Updated user ${user.email} with canAccessTimesheets`);
      }
    }

    console.log('🌱 Checking for sample data...');

    // Check if we already have data
    const existingUsers = await strapi.query('plugin::users-permissions.user').findMany({ limit: 1 });
    if (existingUsers.length > 0) {
      console.log('✓ Sample data already exists, skipping...');
      return;
    }

    console.log('📝 Creating sample data...');

    // Create sample users
    const users = [];
    const sampleUsers = [
      {
        username: 'admin.user',
        email: 'admin@winston.edu',
        password: 'Admin123!',
        confirmed: true,
        blocked: false,
        firstName: 'Admin',
        lastName: 'User',
        userRole: 'admin',
        canAccessLeads: true,
        canAccessStudents: true,
        canAccessUsers: true,
        canAccessDashboard: true,
        isActive: true,
        phone: '+44 20 7946 0958'
      },
      {
        username: 'sarah.johnson',
        email: 'sarah.johnson@winston.edu',
        password: 'Sarah123!',
        confirmed: true,
        blocked: false,
        firstName: 'Sarah',
        lastName: 'Johnson',
        userRole: 'team_member',
        canAccessLeads: true,
        canAccessStudents: true,
        canAccessUsers: false,
        canAccessDashboard: true,
        isActive: true,
        phone: '+44 20 7946 0959'
      },
      {
        username: 'john.smith',
        email: 'john.smith@winston.edu',
        password: 'John123!',
        confirmed: true,
        blocked: false,
        firstName: 'John',
        lastName: 'Smith',
        userRole: 'team_member',
        canAccessLeads: true,
        canAccessStudents: false,
        canAccessUsers: false,
        canAccessDashboard: true,
        isActive: true,
        phone: '+44 20 7946 0960'
      },
      {
        username: 'emma.wilson',
        email: 'emma.wilson@winston.edu',
        password: 'Emma123!',
        confirmed: true,
        blocked: false,
        firstName: 'Emma',
        lastName: 'Wilson',
        userRole: 'team_member',
        canAccessLeads: false,
        canAccessStudents: true,
        canAccessUsers: false,
        canAccessDashboard: true,
        isActive: true,
        phone: '+44 20 7946 0961'
      }
    ];

    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await strapi.query('plugin::users-permissions.user').create({
        data: {
          ...userData,
          password: hashedPassword,
          role: authenticatedRole.id,
          provider: 'local'
        }
      });
      users.push(user);
      console.log(`✓ Created user: ${userData.username}`);
    }

    // Create sample leads
    const sampleLeads = [
      {
        Name: 'Michael Anderson',
        Email: 'michael.anderson@email.com',
        Phone: 447123456789,
        LeadStatus: 'New Lead',
        Courses: 'General English',
        Source: 'Website',
        Country: 'United Kingdom',
        Date: new Date('2025-11-01'),
        Notes: 'Interested in evening classes. Wants to improve conversation skills.',
        publishedAt: new Date()
      },
      {
        Name: 'Priya Patel',
        Email: 'priya.patel@email.com',
        Phone: 447123456790,
        LeadStatus: 'Contacted',
        Courses: 'Level 3 Business Management',
        Source: 'Referral',
        Country: 'India',
        Date: new Date('2025-11-03'),
        Notes: 'Follow-up scheduled for next week. Very interested in business courses.',
        publishedAt: new Date()
      },
      {
        Name: 'Carlos Rodriguez',
        Email: 'carlos.rodriguez@email.com',
        Phone: 447123456791,
        LeadStatus: 'Potential Student',
        Courses: 'Level 3 Information Technology',
        Source: 'Social Media',
        Country: 'Spain',
        Date: new Date('2025-11-05'),
        Notes: 'Attended open day. Requested course brochure and fee structure.',
        publishedAt: new Date()
      },
      {
        Name: 'Fatima Al-Rashid',
        Email: 'fatima.alrashid@email.com',
        Phone: 447123456792,
        LeadStatus: 'New Lead',
        Courses: 'Level 3 Health and Social Care',
        Source: 'Education Fair',
        Country: 'United Arab Emirates',
        Date: new Date('2025-11-07'),
        Notes: 'Looking for January 2026 intake. Needs visa support information.',
        publishedAt: new Date()
      },
      {
        Name: 'James O\'Connor',
        Email: 'james.oconnor@email.com',
        Phone: 447123456793,
        LeadStatus: 'Contacted',
        Courses: 'Level 3 Law',
        Source: 'Google Ads',
        Country: 'Ireland',
        Date: new Date('2025-11-08'),
        Notes: 'Working professional seeking evening/weekend options.',
        publishedAt: new Date()
      },
      {
        Name: 'Li Wei',
        Email: 'li.wei@email.com',
        Phone: 447123456794,
        LeadStatus: 'New Lead',
        Courses: 'General English',
        Source: 'Agent',
        Country: 'China',
        Date: new Date('2025-11-09'),
        Notes: 'Requires IELTS preparation along with general English course.',
        publishedAt: new Date()
      },
      {
        Name: 'Maria Santos',
        Email: 'maria.santos@email.com',
        Phone: 447123456795,
        LeadStatus: 'Potential Student',
        Courses: 'Level 3 Business Management',
        Source: 'Website',
        Country: 'Brazil',
        Date: new Date('2025-11-10'),
        Notes: 'Interested in fast-track options. Budget conscious.',
        publishedAt: new Date()
      },
      {
        Name: 'Ahmed Hassan',
        Email: 'ahmed.hassan@email.com',
        Phone: 447123456796,
        LeadStatus: 'Not Interested',
        Courses: 'Level 3 Information Technology',
        Source: 'Cold Call',
        Country: 'Egypt',
        Date: new Date('2025-10-28'),
        Notes: 'Found alternative course provider. Keep for future marketing.',
        publishedAt: new Date()
      }
    ];

    for (const leadData of sampleLeads) {
      await strapi.entityService.create('api::lead.lead', {
        data: {
          ...leadData,
          assignedUsers: [users[1].id, users[2].id] // Assign to Sarah and John
        }
      });
      console.log(`✓ Created lead: ${leadData.Name}`);
    }

    // Create sample students
    const sampleStudents = [
      {
        regNo: 'WST-2024-001',
        name: 'Jennifer Thompson',
        email: 'jennifer.thompson@student.winston.edu',
        phone: '+44 20 7946 1001',
        course: 'General English',
        country: 'United Kingdom',
        source: 'Website',
        notes: 'Excellent attendance. Progressing well in speaking skills.',
        birthdate: new Date('1995-03-15'),
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        enrollmentStatus: 'Active',
        applicationStatus: 'Enrolled - All documents submitted and verified',
        publishedAt: new Date()
      },
      {
        regNo: 'WST-2024-002',
        name: 'Raj Kumar',
        email: 'raj.kumar@student.winston.edu',
        phone: '+44 20 7946 1002',
        course: 'Level 3 Business Management',
        country: 'India',
        source: 'Agent',
        notes: 'Strong academic background. Interested in university progression.',
        birthdate: new Date('2000-07-22'),
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-09-30'),
        enrollmentStatus: 'Active',
        applicationStatus: 'Enrolled - Awaiting visa documents',
        publishedAt: new Date()
      },
      {
        regNo: 'WST-2024-003',
        name: 'Sophie Dubois',
        email: 'sophie.dubois@student.winston.edu',
        phone: '+44 20 7946 1003',
        course: 'Level 3 Information Technology',
        country: 'France',
        source: 'Referral',
        notes: 'Previous experience in programming. Very motivated student.',
        birthdate: new Date('1998-11-30'),
        startDate: new Date('2024-09-15'),
        endDate: new Date('2025-07-15'),
        enrollmentStatus: 'Active',
        applicationStatus: 'Enrolled - Course materials provided',
        publishedAt: new Date()
      },
      {
        regNo: 'WST-2023-045',
        name: 'David Kim',
        email: 'david.kim@student.winston.edu',
        phone: '+44 20 7946 1004',
        course: 'Level 3 Business Management',
        country: 'South Korea',
        source: 'Education Fair',
        notes: 'Successfully completed course. Excellent results.',
        birthdate: new Date('1997-05-10'),
        startDate: new Date('2023-09-01'),
        endDate: new Date('2024-06-30'),
        enrollmentStatus: 'Completed',
        applicationStatus: 'Graduated - Certificate issued',
        publishedAt: new Date()
      },
      {
        regNo: 'WST-2024-004',
        name: 'Isabella Romano',
        email: 'isabella.romano@student.winston.edu',
        phone: '+44 20 7946 1005',
        course: 'Level 3 Health and Social Care',
        country: 'Italy',
        source: 'Website',
        notes: 'Currently on placement. Good performance in practical assessments.',
        birthdate: new Date('1999-02-18'),
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-08-31'),
        enrollmentStatus: 'Active',
        applicationStatus: 'Enrolled - Placement arranged',
        publishedAt: new Date()
      },
      {
        regNo: 'WST-2024-005',
        name: 'Mohammed Al-Fayed',
        email: 'mohammed.alfayed@student.winston.edu',
        phone: '+44 20 7946 1006',
        course: 'General English',
        country: 'Saudi Arabia',
        source: 'Agent',
        notes: 'Suspended due to attendance issues. Review scheduled.',
        birthdate: new Date('2001-08-25'),
        startDate: new Date('2024-10-15'),
        endDate: new Date('2025-08-15'),
        enrollmentStatus: 'Suspended',
        applicationStatus: 'Suspended - Attendance below 80%',
        publishedAt: new Date()
      },
      {
        regNo: 'WST-2024-006',
        name: 'Ana Silva',
        email: 'ana.silva@student.winston.edu',
        phone: '+44 20 7946 1007',
        course: 'Level 3 Law',
        country: 'Portugal',
        source: 'Social Media',
        notes: 'Top performing student. Interested in legal apprenticeship opportunities.',
        birthdate: new Date('1996-12-05'),
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-08-31'),
        enrollmentStatus: 'Active',
        applicationStatus: 'Enrolled - Outstanding progress',
        publishedAt: new Date()
      }
    ];

    for (const studentData of sampleStudents) {
      await strapi.entityService.create('api::student.student', {
        data: {
          ...studentData,
          assignedUsers: [users[1].id, users[3].id] // Assign to Sarah and Emma
        }
      });
      console.log(`✓ Created student: ${studentData.name}`);
    }

    console.log('\n✅ Sample data created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin User:');
    console.log('  Email: admin@winston.edu');
    console.log('  Password: Admin123!');
    console.log('  Access: Full access to all modules\n');
    console.log('Team Member (Leads & Students):');
    console.log('  Email: sarah.johnson@winston.edu');
    console.log('  Password: Sarah123!');
    console.log('  Access: Leads, Students, Dashboard\n');
    console.log('Team Member (Leads only):');
    console.log('  Email: john.smith@winston.edu');
    console.log('  Password: John123!');
    console.log('  Access: Leads, Dashboard\n');
    console.log('Team Member (Students only):');
    console.log('  Email: emma.wilson@winston.edu');
    console.log('  Password: Emma123!');
    console.log('  Access: Students, Dashboard');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  },
};
