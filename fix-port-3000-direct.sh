#!/bin/bash

# Direct fix for port 3000 - run this ON the VPS
# Copy and paste this entire script into your VPS terminal

echo "=========================================="
echo "Fixing Port 3000 Conflict"
echo "=========================================="
echo ""

# Step 1: Stop PM2 frontend
echo "1. Stopping PM2 frontend..."
pm2 stop crm-frontend 2>/dev/null || true
pm2 delete crm-frontend 2>/dev/null || true
sleep 2

# Step 2: Find what's using port 3000
echo ""
echo "2. Finding what's using port 3000..."
if command -v lsof &> /dev/null; then
    PORT_3000_PIDS=$(lsof -ti:3000 2>/dev/null)
    if [ -n "$PORT_3000_PIDS" ]; then
        echo "   Found processes using port 3000:"
        lsof -i:3000
        echo ""
        echo "   Killing processes: $PORT_3000_PIDS"
        for PID in $PORT_3000_PIDS; do
            kill -9 $PID 2>/dev/null || true
        done
    else
        echo "   Port 3000 appears free (no lsof results)"
    fi
elif command -v ss &> /dev/null; then
    PORT_3000_PIDS=$(ss -tlnp | grep :3000 | awk '{print $6}' | grep -oP 'pid=\K[0-9]+' | sort -u)
    if [ -n "$PORT_3000_PIDS" ]; then
        echo "   Found processes using port 3000:"
        ss -tlnp | grep :3000
        echo ""
        echo "   Killing processes: $PORT_3000_PIDS"
        for PID in $PORT_3000_PIDS; do
            kill -9 $PID 2>/dev/null || true
        done
    else
        echo "   Port 3000 appears free (no ss results)"
    fi
else
    echo "   Cannot check port (lsof and ss not available)"
    echo "   Installing net-tools..."
    apt install -y net-tools 2>/dev/null || true
fi

# Step 3: Kill any node/next processes
echo ""
echo "3. Killing any remaining node/next processes..."
pkill -9 -f "next start" 2>/dev/null || true
pkill -9 -f "node.*3000" 2>/dev/null || true
pkill -9 -f "npm.*start" 2>/dev/null || true
sleep 3

# Step 4: Verify port is free
echo ""
echo "4. Verifying port 3000 is free..."
if command -v lsof &> /dev/null; then
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo "   ✗ Port 3000 still in use!"
        echo "   Processes:"
        lsof -i:3000
        echo "   Force killing again..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    else
        echo "   ✓ Port 3000 is free"
    fi
elif command -v ss &> /dev/null; then
    if ss -tlnp | grep -q :3000; then
        echo "   ✗ Port 3000 still in use!"
        ss -tlnp | grep :3000
    else
        echo "   ✓ Port 3000 is free"
    fi
fi

# Step 5: Clean up PM2
echo ""
echo "5. Cleaning PM2..."
pm2 flush 2>/dev/null || true
pm2 save --force 2>/dev/null || true

# Step 6: Start frontend
echo ""
echo "6. Starting frontend..."
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
      max_restarts: 3,
      min_uptime: '10s'
    }
  ]
};
EOF
fi

# Start only frontend
pm2 start ecosystem.config.js --only crm-frontend
pm2 save

echo ""
echo "7. Waiting 5 seconds..."
sleep 5

# Step 7: Check status
echo ""
echo "8. PM2 Status:"
pm2 status

echo ""
echo "9. Checking port 3000..."
if command -v lsof &> /dev/null; then
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo "   ✓ Port 3000 is now listening"
        lsof -i:3000 | head -3
    else
        echo "   ✗ Port 3000 is NOT listening"
        echo "   Check logs: pm2 logs crm-frontend --err"
    fi
elif command -v ss &> /dev/null; then
    if ss -tlnp | grep -q :3000; then
        echo "   ✓ Port 3000 is now listening"
        ss -tlnp | grep :3000
    else
        echo "   ✗ Port 3000 is NOT listening"
    fi
fi

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
echo ""
echo "If still having issues, check:"
echo "  pm2 logs crm-frontend --err --lines 20"
echo "  lsof -i:3000"
echo "  ps aux | grep node"
echo ""


