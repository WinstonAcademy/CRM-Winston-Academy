# Remove Backend and Frontend from VPS

## Quick Removal

### Option 1: Use the Script

```bash
# Copy script to VPS
scp remove-apps-from-vps.sh root@87.106.148.40:/root/

# SSH into VPS
ssh root@87.106.148.40

# Run script
chmod +x /root/remove-apps-from-vps.sh
/root/remove-apps-from-vps.sh
```

### Option 2: Manual Removal

**SSH into VPS and run:**

```bash
# 1. Stop and delete PM2 processes
pm2 stop all
pm2 delete all
pm2 kill

# 2. Kill any processes on ports
lsof -ti:1337 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -9 -f "strapi" 2>/dev/null || true
pkill -9 -f "next start" 2>/dev/null || true

# 3. Remove application directory
rm -rf /var/www/crm

# 4. Remove PM2 logs
rm -rf /var/www/crm/logs 2>/dev/null || true
rm -f ~/.pm2/dump.pm2 2>/dev/null || true

# 5. Verify removal
ls -la /var/www/crm
# Should show: No such file or directory

# Check ports
lsof -i:1337
lsof -i:3000
# Should return nothing

# Check PM2
pm2 list
# Should show empty list
```

## What Gets Removed

- `/var/www/crm/backend` - Backend application
- `/var/www/crm/frontend` - Frontend application
- `/var/www/crm/logs` - Application logs
- `/var/www/crm/ecosystem.config.js` - PM2 config
- All PM2 processes
- All processes on ports 1337 and 3000

## After Removal

1. **Secure your VPS** (fix security issues first)
2. **Backup your local files** (you already have them)
3. **Redeploy cleanly** after securing the system

## Important Notes

- This will **permanently delete** all application files on the VPS
- Make sure you have backups locally (which you do)
- The database file (`/var/www/crm/backend/.tmp/data.db`) will also be removed
- If you need the database, backup it first:
  ```bash
  # Before removal, backup database
  scp root@87.106.148.40:/var/www/crm/backend/.tmp/data.db ./data-backup.db
  ```


