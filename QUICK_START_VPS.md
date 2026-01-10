# Quick Start: Run Frontend and Backend on VPS

## Step 1: Copy Script to VPS

From your local machine:

```bash
scp start-vps-services.sh root@87.106.148.40:/root/
```

## Step 2: SSH into VPS

```bash
ssh root@87.106.148.40
```

## Step 3: Run the Script

```bash
chmod +x /root/start-vps-services.sh
/root/start-vps-services.sh
```

## Manual Alternative (if script doesn't work)

### 1. Navigate to project directory
```bash
cd /var/www/crm
```

### 2. Start Backend
```bash
cd /var/www/crm/backend
pm2 start npm --name "crm-backend" -- start
```

### 3. Start Frontend
```bash
cd /var/www/crm/frontend
pm2 start npm --name "crm-frontend" -- start
```

### 4. Save PM2 configuration
```bash
pm2 save
pm2 startup
```

### 5. Check Status
```bash
pm2 status
pm2 logs
```

## Verify Services Are Running

```bash
# Check PM2 status
pm2 status

# Check if ports are listening
netstat -tuln | grep -E "1337|3000"

# Test backend
curl http://localhost:1337

# Test frontend
curl http://localhost:3000
```

## View Logs

```bash
# All logs
pm2 logs

# Backend logs only
pm2 logs crm-backend

# Frontend logs only
pm2 logs crm-frontend

# Last 50 lines
pm2 logs --lines 50
```

## Restart Services

```bash
# Restart all
pm2 restart all

# Restart specific service
pm2 restart crm-backend
pm2 restart crm-frontend
```

## Stop Services

```bash
pm2 stop all
```

## Troubleshooting

### Services won't start

1. **Check if files exist:**
   ```bash
   ls -la /var/www/crm/backend/package.json
   ls -la /var/www/crm/frontend/package.json
   ```

2. **Check if dependencies are installed:**
   ```bash
   cd /var/www/crm/backend && ls -la node_modules
   cd /var/www/crm/frontend && ls -la node_modules
   ```

3. **Check if .env files exist:**
   ```bash
   ls -la /var/www/crm/backend/.env
   ls -la /var/www/crm/frontend/.env.production
   ```

4. **Check PM2 logs for errors:**
   ```bash
   pm2 logs --err
   ```

### Port already in use

```bash
# Find what's using the port
lsof -i :1337
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Need to rebuild

```bash
# Backend
cd /var/www/crm/backend
npm run build
pm2 restart crm-backend

# Frontend
cd /var/www/crm/frontend
npm run build
pm2 restart crm-frontend
```


