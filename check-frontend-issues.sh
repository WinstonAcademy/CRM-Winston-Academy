#!/bin/bash

# Script to check why frontend keeps restarting
# Run this on your VPS

echo "=========================================="
echo "Checking Frontend Issues"
echo "=========================================="
echo ""

# Check PM2 status
echo "1. PM2 Status:"
pm2 status
echo ""

# Check frontend logs for errors
echo "2. Frontend Error Logs (last 30 lines):"
echo "----------------------------------------"
pm2 logs crm-frontend --err --lines 30 --nostream 2>/dev/null || echo "No error logs"
echo ""

# Check frontend output logs
echo "3. Frontend Output Logs (last 30 lines):"
echo "----------------------------------------"
pm2 logs crm-frontend --out --lines 30 --nostream 2>/dev/null || echo "No output logs"
echo ""

# Check if .env.production exists
echo "4. Checking Frontend Configuration:"
echo "----------------------------------------"
if [ -f "/var/www/crm/frontend/.env.production" ]; then
    echo "✓ .env.production exists"
    echo "Contents:"
    cat /var/www/crm/frontend/.env.production
else
    echo "✗ .env.production NOT found"
    echo "Creating it now..."
    cat > /var/www/crm/frontend/.env.production << 'EOF'
NEXT_PUBLIC_STRAPI_URL=https://crm.winstonacademy.co.uk/api
NODE_ENV=production
EOF
    echo "✓ Created .env.production"
    echo "Restarting frontend..."
    pm2 restart crm-frontend
fi
echo ""

# Check if frontend is built
echo "5. Checking Frontend Build:"
echo "----------------------------------------"
if [ -d "/var/www/crm/frontend/.next" ]; then
    echo "✓ Frontend is built (.next directory exists)"
else
    echo "✗ Frontend is NOT built (.next directory missing)"
    echo "Building frontend now..."
    cd /var/www/crm/frontend
    npm run build
    if [ $? -eq 0 ]; then
        echo "✓ Build successful"
        echo "Restarting frontend..."
        pm2 restart crm-frontend
    else
        echo "✗ Build failed. Check errors above."
    fi
fi
echo ""

# Check if port 3000 is listening
echo "6. Checking Port 3000:"
echo "----------------------------------------"
if netstat -tuln 2>/dev/null | grep -q ":3000"; then
    echo "✓ Port 3000 is listening"
    echo "Process info:"
    lsof -i :3000 2>/dev/null | head -5
else
    echo "✗ Port 3000 is NOT listening"
fi
echo ""

# Check if frontend responds
echo "7. Testing Frontend Response:"
echo "----------------------------------------"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Frontend responds on localhost:3000"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
    echo "  HTTP Status: $HTTP_CODE"
else
    echo "✗ Frontend does NOT respond on localhost:3000"
fi
echo ""

# Check node_modules
echo "8. Checking Dependencies:"
echo "----------------------------------------"
if [ -d "/var/www/crm/frontend/node_modules" ]; then
    MODULE_COUNT=$(ls -1 /var/www/crm/frontend/node_modules | wc -l)
    echo "✓ node_modules exists ($MODULE_COUNT packages)"
else
    echo "✗ node_modules NOT found"
    echo "Installing dependencies..."
    cd /var/www/crm/frontend
    npm install
fi
echo ""

# Check package.json
echo "9. Checking package.json:"
echo "----------------------------------------"
if [ -f "/var/www/crm/frontend/package.json" ]; then
    echo "✓ package.json exists"
    echo "Start script:"
    grep -A 2 '"start"' /var/www/crm/frontend/package.json || echo "No start script found"
else
    echo "✗ package.json NOT found"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "If frontend is still restarting, check:"
echo "  1. pm2 logs crm-frontend --lines 100"
echo "  2. Check if .env.production has correct URL"
echo "  3. Verify frontend is built: ls -la /var/www/crm/frontend/.next"
echo "  4. Check disk space: df -h"
echo "  5. Check memory: free -h"
echo ""


