# Fix Port 3000 Conflict

## Problem
Frontend keeps restarting with error:
```
Error: listen EADDRINUSE: address already in use :::3000
```

This means another process is using port 3000.

## Quick Fix

### Option 1: Use the Fix Script

```bash
# Copy script to VPS
scp fix-port-3000.sh root@87.106.148.40:/root/

# SSH and run
ssh root@87.106.148.40
chmod +x /root/fix-port-3000.sh
/root/fix-port-3000.sh
```

### Option 2: Manual Fix

**SSH into VPS and run:**

```bash
# 1. Find what's using port 3000
lsof -i:3000

# 2. Stop PM2 frontend
pm2 stop crm-frontend

# 3. Wait a moment
sleep 3

# 4. Check if port is still in use
lsof -ti:3000

# 5. If still in use, kill the process(es)
lsof -ti:3000 | xargs kill -9

# 6. Verify port is free
lsof -i:3000
# Should return nothing

# 7. Start frontend again
pm2 start crm-frontend

# 8. Check status
pm2 status
pm2 logs crm-frontend
```

## Verify It's Fixed

```bash
# Check PM2 status
pm2 status
# Should show crm-frontend as "online" with 0 restarts

# Check port
netstat -tuln | grep 3000
# Should show port 3000 listening

# Test frontend
curl http://localhost:3000
# Should return HTML
```

## Prevent Future Issues

Make sure you:
1. Always stop PM2 processes before killing ports manually
2. Use `pm2 stop` instead of `kill` when possible
3. Check `pm2 status` before starting new processes

## If Problem Persists

Check for zombie processes:

```bash
# Find all node processes
ps aux | grep node

# Find all processes on port 3000
lsof -i:3000

# Kill all node processes (be careful!)
pkill -9 node

# Then restart PM2
pm2 start ecosystem.config.js
```


