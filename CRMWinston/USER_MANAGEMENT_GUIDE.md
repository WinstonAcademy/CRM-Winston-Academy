# User Management Guide

## 🔐 **Password System**

### **Two Separate Password Systems:**

1. **Strapi Backend (Admin Panel)**:
   - Uses proper password hashing (`$2a$10$...`)
   - Secure and production-ready
   - **Password changes in Strapi admin panel DO NOT affect frontend login**

2. **Frontend Demo System**:
   - Uses simple base64 encryption for demo purposes
   - **Password changes in frontend DO NOT affect Strapi admin panel**

### **How to Change Passwords:**

#### **For Strapi Admin Panel Access:**
1. Go to `http://localhost:1337/admin`
2. Navigate to **Settings** → **Administration Panel** → **Administrators**
3. Edit user and change password
4. **This only affects Strapi admin panel login**

#### **For Frontend Application Access:**
1. Login to frontend with default password (`DefaultPass123!`)
2. You'll be redirected to password reset page
3. Change password there
4. **This only affects frontend application login**

## 🚫 **"Blocked" Toggle Explanation**

### **What is "Blocked"?**
The `blocked` field controls user account status:

- **`blocked: false`** ✅ = User can login and access the system
- **`blocked: true`** ❌ = User is banned/disabled and cannot login

### **When to Use "Blocked":**
- **Temporarily disable** a user account
- **Suspend** a user for policy violations
- **Prevent access** without deleting the user
- **Security measure** for compromised accounts

### **How "Blocked" Works:**
1. **In Strapi Admin Panel**: User cannot login to admin panel
2. **In Frontend**: User cannot login to application
3. **Data Preserved**: User data remains in database
4. **Reversible**: Can unblock user anytime

## 🔄 **User Permission Toggles**

### **Available Permissions:**
- **Can Access Leads** - View and manage leads
- **Can Access Students** - View and manage students  
- **Can Access Users** - View and manage other users
- **Can Access Dashboard** - View dashboard and analytics
- **Is Active** - General account status

### **How Toggles Work:**
1. **Frontend Toggle** → Updates both frontend state AND backend database
2. **Backend Toggle** → Updates backend database (frontend will sync on next login)
3. **Real-time Sync** → Changes are immediately reflected in both systems

## 👥 **Current Users in System**

| ID | Username | Email | Role | Status | Access |
|----|----------|-------|------|--------|--------|
| 1 | john.doe | john.doe@winstonacademy.co.uk | admin | ✅ Active | All permissions |
| 2 | team_member | team@winstonacademy.co.uk | team_member | ✅ Active | Leads + Dashboard |
| 3 | john.doe | john.doe@winstonacademy.co.uk | team_member | ✅ Active | No permissions |
| 4 | admin | admin@winstonacademy.co.uk | team_member | ✅ Active | No permissions |
| 5 | sarah.johnson | sarah.johnson@winstonacademy.co.uk | team_member | ✅ Active | Leads + Dashboard |
| 6 | mike.chen | mike.chen@winstonacademy.co.uk | team_member | ✅ Active | Leads + Dashboard |
| 7 | lisa.garcia | lisa.garcia@winstonacademy.co.uk | team_member | ✅ Active | Leads + Students + Dashboard |
| 8 | david.smith | david.smith@winstonacademy.co.uk | team_member | ✅ Active | Students + Dashboard |

## 🔑 **Login Credentials**

### **Admin Access:**
- **Email**: `john.doe@winstonacademy.co.uk`
- **Password**: `Admin123!`

### **Team Members (Default Password):**
- **Default Password**: `DefaultPass123!`
- **First-time users** will be prompted to change password

## ⚠️ **Important Notes**

1. **Password Systems Are Separate**: Changes in one don't affect the other
2. **Blocked Users**: Cannot login to either system
3. **Permission Toggles**: Sync between frontend and backend
4. **Data Consistency**: Frontend and backend users are now synchronized
5. **Demo Purpose**: This is a demo system with simplified security

## 🛠️ **Troubleshooting**

### **Password Not Working:**
- Check if you're using the right system (frontend vs admin panel)
- Verify the correct email/username
- Try the default password for team members

### **Toggle Not Syncing:**
- Refresh the page
- Check browser console for errors
- Verify Strapi is running on port 1337

### **User Not Visible:**
- Check if user is blocked
- Verify user exists in both systems
- Check user permissions
