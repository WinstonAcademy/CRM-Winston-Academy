# Fix PM2 Duplicate Processes

## Problem
You have multiple duplicate PM2 processes running:
- 3 instances of crm-backend (IDs: 0, 2, 4)
- 3 instances of crm-frontend (IDs: 1, 3, 5)
- One frontend instance is errored
- One frontend instance has restarted 227 times

## Solution: Clean Up and Restart

### Option 1: Use the Fix Script (Recommended)

**Step 1: Copy script to VPS**
```bash
scp fix-vps-pm2.sh root@87.106.148.40:/root/
```

**Step 2: SSH and run**
```bash
ssh root@87.106.148.40
chmod +x /root/fix-vps-pm2.sh
/root/fix-vps-pm2.sh
```

### Option 2: Manual Cleanup

**SSH into VPS and run:**

```bash
# 1. Stop all PM2 processes
pm2 stop all

# 2. Delete all PM2 processes
pm2 delete all

# 3. Kill any remaining processes on ports
lsof -ti:1337 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# 4. Wait a moment
sleep 2

# 5. Navigate to project directory
cd /var/www/crm

# 6. Start fresh with ecosystem config
pm2 start ecosystem.config.js

# 7. Save PM2 config
pm2 save

# 8. Check status
pm2 status
pm2 logs
```

## Check Why Frontend Keeps Restarting

After cleaning up, check the logs to see why the frontend was erroring:

```bash
# View frontend logs
pm2 logs crm-frontend --lines 50

# Check for specific errors
pm2 logs crm-frontend --err --lines 50
```

Common issues:
1. **Missing .env.production file**
   ```bash
   # Check if file exists
   ls -la /var/www/crm/frontend/.env.production
   
   # Create if missing
   echo "NEXT_PUBLIC_STRAPI_URL=https://crm.winstonacademy.co.uk/api" > /var/www/crm/frontend/.env.production
   echo "NODE_ENV=production" >> /var/www/crm/frontend/.env.production
   ```

2. **Frontend not built**
   ```bash
   cd /var/www/crm/frontend
   npm run build
   pm2 restart crm-frontend
   ```

3. **Port already in use**
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   # Kill if needed
   kill -9 <PID>
   ```

4. **Missing dependencies**
   ```bash
   cd /var/www/crm/frontend
   npm install
   pm2 restart crm-frontend
   ```

## Verify Everything is Working

```bash
# Check PM2 status (should show only 2 processes)
pm2 status

# Check ports
netstat -tuln | grep -E "1337|3000"

# Test backend
curl http://localhost:1337

# Test frontend
curl http://localhost:3000
```

## Prevent Future Duplicates

Always use the ecosystem.config.js file:

```bash
cd /var/www/crm
pm2 start ecosystem.config.js
pm2 save
```

**Never run:**
```bash
pm2 start npm --name "crm-backend" -- start  # This creates duplicates!
```

**Always use:**
```bash
pm2 start ecosystem.config.js  # This ensures single instances
```


