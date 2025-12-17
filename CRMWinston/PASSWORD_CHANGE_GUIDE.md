# 🔐 Password Change Guide for Content Manager Users

## ✅ **Method 1: Using the Script (Recommended)**

### **Run the Password Change Script:**
```bash
cd /Users/nikitasomani/Desktop/Win/CRMWinston
node change-content-user-password.js
```

### **Script Options:**
1. **Change specific user password** - Enter user ID and new password
2. **Reset all team members** - Set all team members to `DefaultPass123!`
3. **Change admin password** - Update admin user password
4. **Bulk password update** - Set same password for all users

---

## ✅ **Method 2: Manual Strapi Admin Panel**

### **Step-by-Step Instructions:**

1. **Open Strapi Admin Panel**: `http://localhost:1337/admin`

2. **Login**: Use `info@winstonacademy.co.uk` / `Wharf2025@`

3. **Navigate to Content Manager**:
   - Click **"Content Manager"** in left sidebar
   - Click **"Users"** (this is the `up_users` table)

4. **Find the User**:
   - Browse through the users list
   - Click on the user you want to edit

5. **Change Password**:
   - Look for the **"Password"** field
   - Enter the new password
   - Click **"Save"**

---

## ✅ **Method 3: Direct Database Update**

### **For Technical Users:**

1. **Open Database**:
   ```bash
   cd /Users/nikitasomani/Desktop/Win/WinstonCRM-strapi/winston-crm
   sqlite3 .tmp/data.db
   ```

2. **Update Password**:
   ```sql
   UPDATE up_users SET password = 'NewPassword123!' WHERE id = USER_ID;
   ```

3. **Update Password Reset Flag**:
   ```sql
   UPDATE up_users SET needs_password_reset = 0 WHERE id = USER_ID;
   ```

---

## 📋 **Current User List (Content Manager)**

| ID | Username | Email | Role | Current Status |
|----|----------|-------|------|----------------|
| 1 | john.doe | john.doe@winstonacademy.co.uk | admin | ✅ Active |
| 2 | team_member | team@winstonacademy.co.uk | team_member | ✅ Active |
| 3 | john.doe | john.doe@winstonacademy.co.uk | team_member | ✅ Active |
| 4 | admin | admin@winstonacademy.co.uk | team_member | ✅ Active |
| 5 | sarah.johnson | sarah.johnson@winstonacademy.co.uk | team_member | ✅ Active |
| 6 | mike.chen | mike.chen@winstonacademy.co.uk | team_member | ✅ Active |
| 7 | lisa.garcia | lisa.garcia@winstonacademy.co.uk | team_member | ✅ Active |
| 8 | david.smith | david.smith@winstonacademy.co.uk | team_member | ✅ Active |

---

## 🔄 **Password Sync Process**

### **What Happens When You Change a Password:**

1. **Backend Update**: Password is updated in `up_users` table
2. **Frontend Sync**: Script automatically updates frontend mock data
3. **Login Test**: User can login with new password immediately

### **Manual Frontend Sync (if needed):**

If you change a password manually and need to sync to frontend:

1. **Open**: `/Users/nikitasomani/Desktop/Win/CRMWinston/src/services/simpleAuthService.ts`
2. **Find the user** in the `users` array
3. **Update**: `encryptedPassword` and `defaultPassword` fields
4. **Restart frontend** to apply changes

---

## ⚠️ **Important Notes**

1. **Password Requirements**: Minimum 6 characters
2. **Frontend Sync**: Script automatically syncs changes to frontend
3. **Login Testing**: Always test login after password change
4. **Backup**: Keep a record of changed passwords
5. **Security**: Use strong passwords for production

---

## 🚀 **Quick Commands**

### **Reset All Team Members to Default:**
```bash
node change-content-user-password.js
# Choose option 2
```

### **Change Specific User Password:**
```bash
node change-content-user-password.js
# Choose option 1
# Enter User ID and new password
```

### **Bulk Password Update:**
```bash
node change-content-user-password.js
# Choose option 4
# Enter new password for all users
```

---

## 🎯 **Best Practices**

1. **Use the script** for most password changes
2. **Test login** after each password change
3. **Keep passwords secure** and documented
4. **Use descriptive passwords** for demo purposes
5. **Reset team members** to default when needed

---

## 🔧 **Troubleshooting**

### **Password Change Not Working:**
- Check if user exists in Content Manager
- Verify password meets minimum requirements
- Test login with new password
- Check browser console for errors

### **Frontend Not Syncing:**
- Restart frontend application
- Check if script completed successfully
- Manually update `simpleAuthService.ts` if needed

### **User Cannot Login:**
- Verify password was changed correctly
- Check if user is blocked
- Ensure user exists in both systems
