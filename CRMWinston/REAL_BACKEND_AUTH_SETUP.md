# Real Backend Authentication Setup

## ✅ What Has Been Implemented

We have successfully implemented **REAL backend authentication** using Strapi's `users-permissions` plugin. No more hardcoded passwords!

## 🔧 Changes Made

### 1. Strapi Backend Configuration

#### Removed Custom Auth Controller
- **Deleted**: `WinstonCRM-strapi/winston-crm/src/extensions/users-permissions/controllers/auth.js`
- **Reason**: The custom controller was interfering with Strapi's default authentication

#### Extended users-permissions Schema
- **Created**: `WinstonCRM-strapi/winston-crm/src/extensions/users-permissions/content-types/user/schema.json`
- **Added Custom Fields**:
  - `firstName` (string)
  - `lastName` (string)
  - `userRole` (enum: 'admin' | 'team_member')
  - `canAccessLeads` (boolean)
  - `canAccessStudents` (boolean)
  - `canAccessUsers` (boolean)
  - `canAccessDashboard` (boolean)
  - `isActive` (boolean)
  - `phone` (string)

#### Configured Auth Permissions
- Enabled public access to authentication endpoints:
  - `/api/auth/local` (login)
  - `/api/auth/local/register` (registration)
  - `/api/auth/forgot-password`
  - `/api/auth/reset-password`
  - `/api/auth/email-confirmation`
  - `/api/auth/send-email-confirmation`

### 2. Frontend Changes

#### Created realBackendAuthService
- **File**: `src/services/realBackendAuthService.ts`
- **Features**:
  - Real backend authentication (no hardcoded passwords)
  - JWT token management
  - User session management
  - CORS-enabled fetch requests
  - Proper error handling

#### Updated AuthContext
- **File**: `src/context/AuthContext.tsx`
- **Changes**:
  - Now uses `realBackendAuthService` instead of `databaseAuthService`
  - Removed hardcoded password validation
  - All authentication handled by Strapi backend

## 👤 Admin User Created

A new admin user has been created with full permissions:

- **Email**: `adminuser@winstonacademy.co.uk`
- **Password**: `Admin123!`
- **Permissions**:
  - ✅ Full access to Leads table
  - ✅ Full access to Students table
  - ✅ Full access to Users table
  - ✅ Full access to Dashboard
  - ✅ Active status

## 🚀 How to Use

### 1. Start the Backend
```bash
cd /Users/nikitasomani/Desktop/Win/WinstonCRM-strapi/winston-crm
npm run develop
```

### 2. Start the Frontend
```bash
cd /Users/nikitasomani/Desktop/Win/CRMWinston
npm run dev
```

### 3. Login
1. Open your browser and go to `http://localhost:3000`
2. Login with:
   - **Email**: `adminuser@winstonacademy.co.uk`
   - **Password**: `Admin123!`
3. You should now see all backend tables!

## 🔍 Troubleshooting

### "TypeError: Failed to fetch"

If you see this error, it means the frontend cannot connect to the backend. Check:

1. **Is Strapi running?**
   ```bash
   curl http://localhost:1337/_health
   ```
   Should return status 204.

2. **Is the frontend running?**
   ```bash
   curl http://localhost:3000
   ```
   Should return HTML.

3. **Test the auth endpoint directly:**
   ```bash
   curl -X POST http://localhost:1337/api/auth/local \
     -H "Content-Type: application/json" \
     -d '{"identifier":"adminuser@winstonacademy.co.uk","password":"Admin123!"}'
   ```
   Should return a JWT token and user data.

4. **Clear browser cache:**
   - Open Developer Tools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

5. **Restart both services:**
   ```bash
   # Kill all processes
   pkill -f "strapi"
   pkill -f "next"
   
   # Wait a moment
   sleep 3
   
   # Start Strapi
   cd /Users/nikitasomani/Desktop/Win/WinstonCRM-strapi/winston-crm
   npm run develop &
   
   # Start Frontend
   cd /Users/nikitasomani/Desktop/Win/CRMWinston
   npm run dev
   ```

### Cannot See Backend Tables

If you can login but cannot see the backend tables:

1. **Check user permissions:**
   ```bash
   cd /Users/nikitasomani/Desktop/Win/CRMWinston
   node check-admin-user.js
   ```

2. **Verify the user has the custom fields:**
   - Login should return user data with `userRole`, `canAccessLeads`, etc.
   - If these fields are `null` or `undefined`, the schema extension didn't apply

3. **Create a new admin user with permissions:**
   ```bash
   cd /Users/nikitasomani/Desktop/Win/CRMWinston
   node create-admin-with-permissions.js
   ```

## 📋 Technical Details

### Authentication Flow

1. **User enters credentials** in the frontend login form
2. **Frontend sends POST request** to `http://localhost:1337/api/auth/local`
3. **Strapi validates credentials** against the `up_users` table
4. **Strapi generates JWT token** and returns it with user data
5. **Frontend stores token** in localStorage
6. **Frontend includes token** in all subsequent API requests

### Password Storage

- Passwords are **hashed and stored securely** in the Strapi database
- The frontend **never stores passwords**
- JWT tokens are used for authentication after login

### User Permissions

- User permissions are stored in the `up_users` table
- The frontend checks these permissions to show/hide UI elements
- The backend should also enforce these permissions (future enhancement)

## 🎉 Success Criteria

✅ Real backend authentication working
✅ Passwords stored securely in backend database
✅ JWT tokens generated by Strapi backend
✅ Backend validates passwords (not frontend)
✅ User permissions stored in backend
✅ Frontend properly integrated with backend auth
✅ Admin user created with full permissions
✅ NO MORE HARDCODED FRONTEND AUTHENTICATION!

## 📝 Notes

- The old `databaseAuthService` had hardcoded passwords - this is now replaced
- The old `simpleAuthService` had mock authentication - this is no longer used
- All authentication is now handled by Strapi's `users-permissions` plugin
- Custom fields are added to the `up_users` table via schema extension

## 🔐 Security Improvements

1. **No hardcoded passwords** in the frontend code
2. **Passwords hashed** using bcrypt in the backend
3. **JWT tokens** for secure session management
4. **CORS properly configured** for cross-origin requests
5. **Credentials included** in requests for secure cookie handling

