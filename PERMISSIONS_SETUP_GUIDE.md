# API Permissions Setup Guide

## Issue
You're unable to see leads, students, and users tables in the frontend because the Strapi API permissions are not configured for authenticated users.

## Why This Happens
In Strapi 5, API permissions must be manually configured through the admin panel. By default, all API endpoints are protected and return 403 Forbidden errors.

## Solution: Enable Permissions Through Strapi Admin

### Step-by-Step Instructions:

1. **Open Strapi Admin Panel**
   - Navigate to: http://localhost:1337/admin
   - Login with any admin credentials (e.g., create an admin account if prompted)

2. **Navigate to Roles Settings**
   - Click on **"Settings"** in the left sidebar (⚙️ gear icon)
   - Under **"USERS & PERMISSIONS PLUGIN"** section, click on **"Roles"**

3. **Edit Authenticated Role**
   - Click on **"Authenticated"** role

4. **Enable Lead Permissions**
   - Find and expand **"Lead"** section
   - Check ALL boxes:
     - ☑️ find
     - ☑️ findOne
     - ☑️ create
     - ☑️ update
     - ☑️ delete

5. **Enable Student Permissions**
   - Find and expand **"Student"** section
   - Check ALL boxes:
     - ☑️ find
     - ☑️ findOne
     - ☑️ create
     - ☑️ update
     - ☑️ delete

6. **Enable User Permissions (if visible)**
   - Find and expand **"User"** section (if it exists)
   - Check ALL boxes:
     - ☑️ find
     - ☑️ findOne
     - ☑️ create
     - ☑️ update
     - ☑️ delete

7. **Enable Users-Permissions Plugin**
   - Find and expand **"Users-permissions"** section
   - Under **"User"** subsection, check:
     - ☑️ me
     - ☑️ find
     - ☑️ findOne
     - ☑️ count
     - ☑️ create
     - ☑️ update
     - ☑️ destroy
   - Under **"Auth"** subsection, check ALL boxes (callback, connect, forgotPassword, etc.)

8. **Save Changes**
   - Click the **"Save"** button at the top right corner
   - Wait for the success message

## Verify It Works

After enabling permissions, test the API:

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:1337/api/auth/local \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@winston.edu","password":"Admin123!"}' \
  | grep -o '"jwt":"[^"]*' | cut -d'"' -f4)

# Test Leads API
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:1337/api/leads?pagination[pageSize]=2"

# Test Students API
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:1337/api/students?pagination[pageSize]=2"
```

Both should return JSON data instead of 403 errors.

## Frontend Access

Once permissions are enabled:

1. Open frontend: http://localhost:3000
2. Login with: `admin@winston.edu` / `Admin123!`
3. You should now see:
   - Leads table in the Leads section
   - Students table in the Students section
   - Users table in the Users section

## Troubleshooting

### Still seeing 403 errors?
- Make sure you clicked "Save" in the Strapi admin
- Try logging out and logging back into the frontend
- Clear browser cache and localStorage
- Restart the Strapi backend

### Can't see some sections?
- Check that the user has the correct permission fields set:
  - `canAccessLeads: true`
  - `canAccessStudents: true`
  - `canAccessUsers: true`
  - `canAccessDashboard: true`

### Need to check user permissions in database?
```bash
cd /Users/nikitasomani/Downloads/Win/WinstonCRM-strapi/winston-crm
sqlite3 .tmp/data.db "SELECT id, email, userRole, canAccessLeads, canAccessStudents, canAccessUsers FROM up_users;"
```

## Quick Setup Script

Run this command to see the permissions setup guide:
```bash
cd /Users/nikitasomani/Downloads/Win/WinstonCRM-strapi/winston-crm
node setup-permissions.js
```

## Important Notes

- ⚠️ These permissions apply to ALL authenticated users
- 🔒 For production, you should create different roles with specific permissions
- 📝 The sample data includes users with different permission levels, but the API permissions must be enabled first
- 🔄 You only need to do this setup once per Strapi installation

