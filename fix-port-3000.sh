#!/bin/bash

# Script to fix port 3000 conflict
# Run this on your VPS

echo "=========================================="
echo "Fixing Port 3000 Conflict"
echo "=========================================="
echo ""

# Find what's using port 3000
echo "1. Checking what's using port 3000..."
PORT_3000_PIDS=$(lsof -ti:3000 2>/dev/null)

if [ -z "$PORT_3000_PIDS" ]; then
    echo "✓ Port 3000 is free"
else
    echo "✗ Port 3000 is in use by:"
    lsof -i:3000 | head -10
    echo ""
    echo "Process IDs: $PORT_3000_PIDS"
    echo ""
    
    # Check if it's a PM2 process
    for PID in $PORT_3000_PIDS; do
        PROCESS_NAME=$(ps -p $PID -o comm= 2>/dev/null)
        echo "  PID $PID: $PROCESS_NAME"
        
        # Check if it's managed by PM2
        PM2_INFO=$(pm2 list | grep -E "crm-frontend" | awk '{print $2}')
        if [ -n "$PM2_INFO" ]; then
            echo "    This appears to be a PM2 process"
        fi
    done
    
    echo ""
    echo "2. Stopping PM2 frontend process..."
    pm2 stop crm-frontend 2>/dev/null || true
    
    echo "3. Waiting 3 seconds..."
    sleep 3
    
    # Check again
    PORT_3000_PIDS=$(lsof -ti:3000 2>/dev/null)
    if [ -n "$PORT_3000_PIDS" ]; then
        echo "4. Port 3000 still in use. Killing processes..."
        for PID in $PORT_3000_PIDS; do
            echo "  Killing PID $PID..."
            kill -9 $PID 2>/dev/null || true
        done
        sleep 2
    else
        echo "✓ Port 3000 is now free"
    fi
fi

echo ""
echo "5. Verifying port 3000 is free..."
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✗ Port 3000 is still in use!"
    echo "  Run manually: lsof -i:3000"
    echo "  Then kill: kill -9 <PID>"
else
    echo "✓ Port 3000 is free"
fi

echo ""
echo "6. Starting frontend with PM2..."
pm2 start crm-frontend

echo ""
echo "7. Waiting 5 seconds for startup..."
sleep 5

echo ""
echo "8. Checking status..."
pm2 status

echo ""
echo "9. Checking if port 3000 is now listening..."
if netstat -tuln 2>/dev/null | grep -q ":3000"; then
    echo "✓ Port 3000 is now listening"
    echo "  Process info:"
    lsof -i:3000 | head -3
else
    echo "✗ Port 3000 is still not listening"
    echo "  Check logs: pm2 logs crm-frontend"
fi

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
echo ""
echo "View logs:"
echo "  pm2 logs crm-frontend"
echo ""
echo "If still having issues, check:"
echo "  1. pm2 logs crm-frontend --err"
echo "  2. lsof -i:3000"
echo "  3. netstat -tuln | grep 3000"
echo ""


