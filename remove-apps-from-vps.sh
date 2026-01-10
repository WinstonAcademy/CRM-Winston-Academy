#!/bin/bash

# Script to remove backend and frontend from VPS
# Run this ON the VPS

echo "=========================================="
echo "Removing Backend and Frontend from VPS"
echo "=========================================="
echo ""

# Step 1: Stop PM2 processes
echo "1. Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
echo "   ✓ PM2 processes stopped"
echo ""

# Step 2: Kill any processes on ports 1337 and 3000
echo "2. Killing processes on ports 1337 and 3000..."
lsof -ti:1337 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -9 -f "strapi" 2>/dev/null || true
pkill -9 -f "next start" 2>/dev/null || true
pkill -9 -f "node.*1337" 2>/dev/null || true
pkill -9 -f "node.*3000" 2>/dev/null || true
echo "   ✓ Port processes killed"
echo ""

# Step 3: Remove application directories
echo "3. Removing application directories..."
if [ -d "/var/www/crm" ]; then
    echo "   Removing /var/www/crm..."
    rm -rf /var/www/crm
    echo "   ✓ /var/www/crm removed"
else
    echo "   ⚠ /var/www/crm not found (already removed?)"
fi
echo ""

# Step 4: Remove PM2 logs
echo "4. Removing PM2 logs..."
if [ -d "/var/www/crm/logs" ]; then
    rm -rf /var/www/crm/logs
    echo "   ✓ Logs removed"
fi

# Remove PM2 dump file
rm -f ~/.pm2/dump.pm2 2>/dev/null || true
echo "   ✓ PM2 dump file removed"
echo ""

# Step 5: Remove PM2 ecosystem config (if exists in home)
if [ -f "/root/ecosystem.config.js" ]; then
    rm -f /root/ecosystem.config.js
    echo "   ✓ Ecosystem config removed from /root"
fi
echo ""

# Step 6: Verify removal
echo "5. Verifying removal..."
if [ -d "/var/www/crm" ]; then
    echo "   ✗ /var/www/crm still exists!"
else
    echo "   ✓ /var/www/crm removed successfully"
fi

# Check if ports are free
if lsof -ti:1337 > /dev/null 2>&1; then
    echo "   ⚠ Port 1337 still in use"
else
    echo "   ✓ Port 1337 is free"
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo "   ⚠ Port 3000 still in use"
else
    echo "   ✓ Port 3000 is free"
fi
echo ""

# Step 7: Check PM2 status
echo "6. PM2 Status:"
pm2 list
echo ""

echo "=========================================="
echo "Removal Complete!"
echo "=========================================="
echo ""
echo "Removed:"
echo "  - /var/www/crm (backend and frontend)"
echo "  - PM2 processes"
echo "  - PM2 logs"
echo ""
echo "Next steps:"
echo "  1. Secure your VPS (fix security issues)"
echo "  2. Redeploy applications from local files"
echo "  3. Set up proper security before redeploying"
echo ""


