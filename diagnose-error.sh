#!/bin/bash

# Comprehensive error diagnostic script
# Run this on your VPS to identify the exact issue

echo "=========================================="
echo "Comprehensive Error Diagnostic"
echo "=========================================="
echo ""

# 1. Check PM2 Status
echo "1. PM2 Status:"
echo "----------------------------------------"
pm2 status
echo ""

# 2. Check what's using port 3000
echo "2. Port 3000 Usage:"
echo "----------------------------------------"
if lsof -i:3000 > /dev/null 2>&1; then
    echo "Port 3000 is in use by:"
    lsof -i:3000
    echo ""
    echo "Process details:"
    PORT_PIDS=$(lsof -ti:3000 2>/dev/null)
    for PID in $PORT_PIDS; do
        echo "  PID $PID:"
        ps -p $PID -o pid,ppid,user,cmd 2>/dev/null || echo "    Process not found (may have died)"
    done
else
    echo "✓ Port 3000 is FREE"
fi
echo ""

# 3. Check port 1337
echo "3. Port 1337 Usage:"
echo "----------------------------------------"
if lsof -i:1337 > /dev/null 2>&1; then
    echo "Port 1337 is in use by:"
    lsof -i:1337 | head -5
else
    echo "✗ Port 1337 is NOT in use (backend may not be running)"
fi
echo ""

# 4. Check PM2 logs for frontend
echo "4. Frontend Error Logs (last 20 lines):"
echo "----------------------------------------"
pm2 logs crm-frontend --err --lines 20 --nostream 2>/dev/null || echo "No error logs found"
echo ""

# 5. Check PM2 logs for backend
echo "5. Backend Error Logs (last 10 lines):"
echo "----------------------------------------"
pm2 logs crm-backend --err --lines 10 --nostream 2>/dev/null || echo "No error logs found"
echo ""

# 6. Check if frontend files exist
echo "6. Frontend File Check:"
echo "----------------------------------------"
if [ -d "/var/www/crm/frontend" ]; then
    echo "✓ Frontend directory exists"
    
    if [ -f "/var/www/crm/frontend/package.json" ]; then
        echo "✓ package.json exists"
    else
        echo "✗ package.json NOT found"
    fi
    
    if [ -d "/var/www/crm/frontend/.next" ]; then
        echo "✓ Frontend is built (.next directory exists)"
    else
        echo "✗ Frontend is NOT built (.next directory missing)"
        echo "  This could cause startup issues"
    fi
    
    if [ -f "/var/www/crm/frontend/.env.production" ]; then
        echo "✓ .env.production exists"
        echo "  Contents:"
        cat /var/www/crm/frontend/.env.production | sed 's/^/    /'
    else
        echo "✗ .env.production NOT found"
        echo "  This is likely causing issues!"
    fi
    
    if [ -d "/var/www/crm/frontend/node_modules" ]; then
        MODULE_COUNT=$(ls -1 /var/www/crm/frontend/node_modules 2>/dev/null | wc -l)
        echo "✓ node_modules exists ($MODULE_COUNT packages)"
    else
        echo "✗ node_modules NOT found"
    fi
else
    echo "✗ Frontend directory NOT found at /var/www/crm/frontend"
fi
echo ""

# 7. Check backend files
echo "7. Backend File Check:"
echo "----------------------------------------"
if [ -d "/var/www/crm/backend" ]; then
    echo "✓ Backend directory exists"
    
    if [ -f "/var/www/crm/backend/package.json" ]; then
        echo "✓ package.json exists"
    else
        echo "✗ package.json NOT found"
    fi
    
    if [ -f "/var/www/crm/backend/.env" ]; then
        echo "✓ .env exists"
    else
        echo "✗ .env NOT found"
    fi
else
    echo "✗ Backend directory NOT found at /var/www/crm/backend"
fi
echo ""

# 8. Check ecosystem.config.js
echo "8. PM2 Configuration:"
echo "----------------------------------------"
if [ -f "/var/www/crm/ecosystem.config.js" ]; then
    echo "✓ ecosystem.config.js exists"
    echo "  Frontend config:"
    grep -A 10 "crm-frontend" /var/www/crm/ecosystem.config.js | head -8 | sed 's/^/    /'
else
    echo "✗ ecosystem.config.js NOT found"
fi
echo ""

# 9. Check all node processes
echo "9. All Node Processes:"
echo "----------------------------------------"
NODE_PROCS=$(ps aux | grep node | grep -v grep)
if [ -n "$NODE_PROCS" ]; then
    echo "Found node processes:"
    ps aux | grep node | grep -v grep | head -10
else
    echo "No node processes found"
fi
echo ""

# 10. Check system resources
echo "10. System Resources:"
echo "----------------------------------------"
echo "Memory:"
free -h | head -2
echo ""
echo "Disk space:"
df -h /var/www/crm | tail -1
echo ""

# 11. Test local connections
echo "11. Testing Local Connections:"
echo "----------------------------------------"
echo "Testing backend (port 1337):"
BACKEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:1337 2>&1)
if [ "$BACKEND_TEST" = "200" ] || [ "$BACKEND_TEST" = "301" ] || [ "$BACKEND_TEST" = "302" ]; then
    echo "  ✓ Backend responding (HTTP $BACKEND_TEST)"
else
    echo "  ✗ Backend not responding (HTTP $BACKEND_TEST)"
fi

echo ""
echo "Testing frontend (port 3000):"
FRONTEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000 2>&1)
if [ "$FRONTEND_TEST" = "200" ]; then
    echo "  ✓ Frontend responding (HTTP $FRONTEND_TEST)"
else
    echo "  ✗ Frontend not responding (HTTP $FRONTEND_TEST)"
fi
echo ""

# 12. Summary
echo "=========================================="
echo "Summary & Recommendations"
echo "=========================================="
echo ""

# Check for the main issues
ISSUES_FOUND=0

if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠ ISSUE: Port 3000 is in use by another process"
    echo "   Fix: Kill the process using port 3000"
    echo "   Command: lsof -ti:3000 | xargs kill -9"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ ! -f "/var/www/crm/frontend/.env.production" ]; then
    echo "⚠ ISSUE: Frontend .env.production file is missing"
    echo "   Fix: Create .env.production with:"
    echo "   echo 'NEXT_PUBLIC_STRAPI_URL=https://crm.winstonacademy.co.uk/api' > /var/www/crm/frontend/.env.production"
    echo "   echo 'NODE_ENV=production' >> /var/www/crm/frontend/.env.production"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ ! -d "/var/www/crm/frontend/.next" ]; then
    echo "⚠ ISSUE: Frontend is not built"
    echo "   Fix: Build the frontend"
    echo "   Command: cd /var/www/crm/frontend && npm run build"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

PM2_RESTARTS=$(pm2 jlist | grep -o '"restart_time":[0-9]*' | grep -o '[0-9]*' | head -1)
if [ -n "$PM2_RESTARTS" ] && [ "$PM2_RESTARTS" -gt 10 ]; then
    echo "⚠ ISSUE: Frontend has restarted $PM2_RESTARTS times"
    echo "   This indicates a persistent startup issue"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✓ No obvious issues found"
    echo "   Check PM2 logs for detailed error messages:"
    echo "   pm2 logs crm-frontend --err --lines 50"
else
    echo ""
    echo "Found $ISSUES_FOUND issue(s) that need to be fixed"
fi

echo ""


