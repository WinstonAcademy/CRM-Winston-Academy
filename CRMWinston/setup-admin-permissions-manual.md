# Admin Permissions Setup Guide

This guide will help you set up proper admin access rights in your Winston CRM system.

## 🚀 Quick Setup (Recommended)

### Step 1: Start Strapi Backend
```bash
cd WinstonCRM-strapi/winston-crm
npm run develop
```

### Step 2: Access Admin Panel
1. Open your browser and go to: `http://localhost:1337/admin`
2. Login with your admin credentials

### Step 3: Configure User Permissions
1. Navigate to **Settings** → **Users & Permissions Plugin**
2. Click on **Roles**
3. You should see three roles: **Authenticated**, **Public**, and **Admin**

### Step 4: Update Admin Role Permissions
1. Click on the **Admin** role to edit it
2. Enable ALL permissions for the following content types:
   - **Lead** (api::lead.lead)
     - ✅ find
     - ✅ findOne
     - ✅ create
     - ✅ update
     - ✅ delete
   - **Student** (api::student.student)
     - ✅ find
     - ✅ findOne
     - ✅ create
     - ✅ update
     - ✅ delete
   - **User** (api::user.user)
     - ✅ find
     - ✅ findOne
     - ✅ create
     - ✅ update
     - ✅ delete
3. Click **Save**

### Step 5: Update Authenticated Role (Optional)
1. Click on the **Authenticated** role
2. Enable the same permissions as above (this gives all logged-in users access)
3. Click **Save**

### Step 6: Verify Admin Users
1. Go to **Content Manager** → **User**
2. Find users with `role: "admin"`
3. Ensure they have:
   - `canAccessLeads: true`
   - `canAccessStudents: true`
   - `canAccessUsers: true`
   - `canAccessDashboard: true`
   - `isActive: true`

## 🔧 Automated Setup (Alternative)

If you prefer to use the automated script:

1. Make sure Strapi is running (`npm run develop`)
2. Run the permission fix script:
   ```bash
   cd CRMWinston
   node fix-admin-permissions.js
   ```

## ✅ Verification

After setup, verify that admin users can:

1. **Access Leads**: View, create, edit, and delete leads
2. **Access Students**: View, create, edit, and delete students  
3. **Access Users**: View, create, edit, and delete users
4. **Access Dashboard**: View all dashboard features and analytics

## 🐛 Troubleshooting

### If admin users still don't have access:

1. **Check User Role**: Ensure the user's `role` field is set to `"admin"`
2. **Check Permissions**: Verify the Admin role has all permissions enabled
3. **Check User Status**: Ensure `isActive` is `true`
4. **Restart Strapi**: Sometimes a restart is needed after permission changes
5. **Clear Browser Cache**: Clear your browser cache and cookies

### If you get 403 Forbidden errors:

1. Check that the user is properly authenticated
2. Verify the user has the correct role assigned
3. Ensure the role has the necessary permissions
4. Check that the API endpoints are properly configured

## 📋 Permission Matrix

| Role | Leads | Students | Users | Dashboard |
|------|-------|----------|-------|-----------|
| Admin | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| Manager | ✅ Full Access | ✅ Full Access | ❌ No Access | ✅ Full Access |
| Team Member | ✅ Full Access | ❌ No Access | ❌ No Access | ✅ Full Access |
| Public | ✅ Full Access | ❌ No Access | ❌ No Access | ❌ No Access |

## 🔐 Security Notes

- Admin users have full access to all system features
- Always verify user roles before granting admin access
- Consider using more granular permissions for production environments
- Regularly audit user permissions and roles

## 📞 Support

If you encounter any issues with the permission setup, please check:
1. Strapi logs for any error messages
2. Browser console for JavaScript errors
3. Network tab for failed API requests
4. User authentication status

---

**Note**: This setup ensures that admin users have complete access to all CRM features while maintaining appropriate access controls for other user roles.

