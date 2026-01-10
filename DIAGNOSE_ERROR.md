# Diagnose Error - Quick Guide

## Run Diagnostic Script

```bash
# Copy script to VPS
scp diagnose-error.sh root@87.106.148.40:/root/

# SSH and run
ssh root@87.106.148.40
chmod +x /root/diagnose-error.sh
/root/diagnose-error.sh
```

## Manual Diagnostic Commands

### 1. Check PM2 Status
```bash
pm2 status
pm2 list
```

### 2. Check Port 3000
```bash
# See what's using it
lsof -i:3000

# Or
netstat -tulpn | grep 3000

# Get process details
ps aux | grep $(lsof -ti:3000)
```

### 3. Check Frontend Logs
```bash
# Error logs
pm2 logs crm-frontend --err --lines 50

# All logs
pm2 logs crm-frontend --lines 50
```

### 4. Check Frontend Files
```bash
# Check if built
ls -la /var/www/crm/frontend/.next

# Check .env.production
cat /var/www/crm/frontend/.env.production

# Check package.json
cat /var/www/crm/frontend/package.json | grep -A 3 '"start"'
```

### 5. Check All Node Processes
```bash
ps aux | grep node
ps aux | grep next
```

### 6. Test Connections
```bash
# Test backend
curl -v http://localhost:1337

# Test frontend
curl -v http://localhost:3000
```

## Common Errors and Fixes

### Error: EADDRINUSE (Port already in use)
**Fix:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
pm2 restart crm-frontend
```

### Error: Missing .env.production
**Fix:**
```bash
cat > /var/www/crm/frontend/.env.production << EOF
NEXT_PUBLIC_STRAPI_URL=https://crm.winstonacademy.co.uk/api
NODE_ENV=production
EOF
pm2 restart crm-frontend
```

### Error: Frontend not built
**Fix:**
```bash
cd /var/www/crm/frontend
npm run build
pm2 restart crm-frontend
```

### Error: Module not found
**Fix:**
```bash
cd /var/www/crm/frontend
npm install
npm run build
pm2 restart crm-frontend
```


