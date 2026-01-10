#!/bin/bash

# Aggressive fix for port 3000 conflict
# This will stop PM2, kill all processes on port 3000, and restart cleanly

echo "=========================================="
echo "Force Fix Port 3000 Conflict"
echo "=========================================="
echo ""

# Step 1: Stop PM2 frontend and disable auto-restart
echo "1. Stopping PM2 frontend and disabling auto-restart..."
pm2 stop crm-frontend 2>/dev/null || true
pm2 delete crm-frontend 2>/dev/null || true

# Disable PM2 startup to prevent auto-restart
pm2 save --force 2>/dev/null || true

echo "   Waiting 3 seconds..."
sleep 3

# Step 2: Find and kill ALL processes on port 3000
echo ""
echo "2. Finding all processes on port 3000..."
PORT_3000_PIDS=$(lsof -ti:3000 2>/dev/null)

if [ -z "$PORT_3000_PIDS" ]; then
    echo "   ✓ Port 3000 is free"
else
    echo "   Found processes using port 3000:"
    lsof -i:3000 | head -10
    echo ""
    echo "   Killing all processes on port 3000..."
    for PID in $PORT_3000_PIDS; do
        echo "     Killing PID $PID..."
        kill -9 $PID 2>/dev/null || true
    done
    
    echo "   Waiting 3 seconds for processes to die..."
    sleep 3
fi

# Step 3: Double-check port is free
echo ""
echo "3. Verifying port 3000 is free..."
REMAINING_PIDS=$(lsof -ti:3000 2>/dev/null)
if [ -n "$REMAINING_PIDS" ]; then
    echo "   ✗ Port 3000 still in use! Force killing..."
    for PID in $REMAINING_PIDS; do
        kill -9 $PID 2>/dev/null || true
    done
    sleep 2
else
    echo "   ✓ Port 3000 is now free"
fi

# Step 4: Check for any other node processes that might interfere
echo ""
echo "4. Checking for other node processes..."
NODE_PROCESSES=$(ps aux | grep -E "node.*3000|next.*start" | grep -v grep | awk '{print $2}')
if [ -n "$NODE_PROCESSES" ]; then
    echo "   Found other node processes, killing them..."
    for PID in $NODE_PROCESSES; do
        echo "     Killing PID $PID..."
        kill -9 $PID 2>/dev/null || true
    done
    sleep 2
else
    echo "   ✓ No conflicting node processes found"
fi

# Step 5: Final verification
echo ""
echo "5. Final port check..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   ✗ Port 3000 is STILL in use!"
    echo "   Run manually to see what's using it:"
    echo "     lsof -i:3000"
    echo "     kill -9 <PID>"
    exit 1
else
    echo "   ✓ Port 3000 is confirmed free"
fi

# Step 6: Restart frontend with PM2
echo ""
echo "6. Starting frontend with PM2..."
cd /var/www/crm

# Make sure ecosystem.config.js exists
if [ ! -f "ecosystem.config.js" ]; then
    echo "   Creating ecosystem.config.js..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'crm-backend',
      cwd: '/var/www/crm/backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 1337
      },
      error_file: '/var/www/crm/logs/backend-error.log',
      out_file: '/var/www/crm/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      instances: 1,
      exec_mode: 'fork'
    },
    {
      name: 'crm-frontend',
      cwd: '/var/www/crm/frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/www/crm/logs/frontend-error.log',
      out_file: '/var/www/crm/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      instances: 1,
      exec_mode: 'fork',
      max_restarts: 5,
      min_uptime: '10s'
    }
  ]
};
EOF
fi

# Start only frontend (backend should already be running)
pm2 start ecosystem.config.js --only crm-frontend

# Save PM2 config
pm2 save

echo ""
echo "7. Waiting 5 seconds for startup..."
sleep 5

# Step 7: Check status
echo ""
echo "8. Checking status..."
pm2 status

echo ""
echo "9. Checking if port 3000 is listening..."
if netstat -tuln 2>/dev/null | grep -q ":3000"; then
    echo "   ✓ Port 3000 is now listening!"
    echo "   Process info:"
    lsof -i:3000 | head -3
else
    echo "   ✗ Port 3000 is still not listening"
    echo "   Check logs: pm2 logs crm-frontend --err"
fi

# Step 8: Check logs for any immediate errors
echo ""
echo "10. Recent frontend logs (last 5 lines)..."
pm2 logs crm-frontend --lines 5 --nostream 2>/dev/null | tail -5 || echo "   No logs yet"

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
echo ""
echo "If port 3000 is still not working:"
echo "  1. Check what's using it: lsof -i:3000"
echo "  2. View logs: pm2 logs crm-frontend --err"
echo "  3. Check if frontend is built: ls -la /var/www/crm/frontend/.next"
echo "  4. Try restarting: pm2 restart crm-frontend"
echo ""


