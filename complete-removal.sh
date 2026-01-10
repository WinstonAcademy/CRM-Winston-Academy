#!/bin/bash

# Complete removal of backend and frontend from VPS
# Run this on the VPS

echo "=========================================="
echo "Complete Removal of Backend and Frontend"
echo "=========================================="
echo ""

# Check what exists
echo "1. Checking what exists..."
if [ -d "/var/www/crm" ]; then
    echo "   Found /var/www/crm directory"
    ls -la /var/www/crm | head -10
else
    echo "   ✓ /var/www/crm does not exist"
fi

if [ -d "/var/www/crm/backend" ]; then
    echo "   Found /var/www/crm/backend"
else
    echo "   ✓ /var/www/crm/backend does not exist"
fi

if [ -d "/var/www/crm/frontend" ]; then
    echo "   Found /var/www/crm/frontend"
else
    echo "   ✓ /var/www/crm/frontend does not exist"
fi
echo ""

# Stop and remove PM2 processes
echo "2. Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
echo "   ✓ PM2 processes stopped"
echo ""

# Kill any processes on ports
echo "3. Killing processes on ports 1337 and 3000..."
lsof -ti:1337 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -9 -f "strapi" 2>/dev/null || true
pkill -9 -f "next start" 2>/dev/null || true
echo "   ✓ Port processes killed"
echo ""

# Remove application directories
echo "4. Removing application directories..."
rm -rf /var/www/crm 2>/dev/null || true
rm -rf /var/www/crm/backend 2>/dev/null || true
rm -rf /var/www/crm/frontend 2>/dev/null || true
echo "   ✓ Directories removed"
echo ""

# Remove PM2 logs
echo "5. Removing PM2 logs..."
rm -rf /var/www/crm/logs 2>/dev/null || true
rm -rf ~/.pm2/logs/* 2>/dev/null || true
rm -f ~/.pm2/dump.pm2 2>/dev/null || true
echo "   ✓ Logs removed"
echo ""

# Remove ecosystem config if exists
echo "6. Removing PM2 config files..."
rm -f /var/www/crm/ecosystem.config.js 2>/dev/null || true
rm -f /root/ecosystem.config.js 2>/dev/null || true
echo "   ✓ Config files removed"
echo ""

# Final verification
echo "7. Final verification..."
if [ -d "/var/www/crm" ]; then
    echo "   ✗ /var/www/crm still exists!"
    echo "   Contents:"
    ls -la /var/www/crm
else
    echo "   ✓ /var/www/crm does not exist"
fi

if [ -d "/var/www/crm/backend" ]; then
    echo "   ✗ /var/www/crm/backend still exists!"
else
    echo "   ✓ /var/www/crm/backend does not exist"
fi

if [ -d "/var/www/crm/frontend" ]; then
    echo "   ✗ /var/www/crm/frontend still exists!"
else
    echo "   ✓ /var/www/crm/frontend does not exist"
fi

# Check ports
echo ""
echo "8. Checking ports..."
if lsof -ti:1337 > /dev/null 2>&1; then
    echo "   ⚠ Port 1337 still in use"
    lsof -i:1337
else
    echo "   ✓ Port 1337 is free"
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   ⚠ Port 3000 still in use"
    lsof -i:3000
else
    echo "   ✓ Port 3000 is free"
fi

# Check PM2
echo ""
echo "9. PM2 Status:"
pm2 list

echo ""
echo "=========================================="
echo "Removal Complete!"
echo "=========================================="
echo ""
echo "All backend and frontend files have been removed."
echo ""


