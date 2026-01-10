#!/bin/bash

# Quick verification script for VPS services
# Run this on your VPS

echo "=========================================="
echo "Service Verification"
echo "=========================================="
echo ""

# PM2 Status
echo "1. PM2 Status:"
pm2 status
echo ""

# Port Status
echo "2. Port Status:"
if netstat -tuln 2>/dev/null | grep -q ":1337"; then
    echo "✓ Backend listening on port 1337"
else
    echo "✗ Backend NOT listening on port 1337"
fi

if netstat -tuln 2>/dev/null | grep -q ":3000"; then
    echo "✓ Frontend listening on port 3000"
else
    echo "✗ Frontend NOT listening on port 3000"
fi
echo ""

# Test Backend
echo "3. Testing Backend:"
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:1337)
if [ "$BACKEND_RESPONSE" = "200" ] || [ "$BACKEND_RESPONSE" = "301" ] || [ "$BACKEND_RESPONSE" = "302" ]; then
    echo "✓ Backend responding (HTTP $BACKEND_RESPONSE)"
else
    echo "✗ Backend not responding (HTTP $BACKEND_RESPONSE)"
fi
echo ""

# Test Frontend
echo "4. Testing Frontend:"
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "✓ Frontend responding (HTTP $FRONTEND_RESPONSE)"
else
    echo "✗ Frontend not responding (HTTP $FRONTEND_RESPONSE)"
fi
echo ""

# Check Nginx (if configured)
echo "5. Checking Nginx:"
if systemctl is-active --quiet nginx 2>/dev/null; then
    echo "✓ Nginx is running"
    if [ -f "/etc/nginx/sites-enabled/crm.winstonacademy.co.uk" ]; then
        echo "✓ Nginx config exists"
    else
        echo "⚠ Nginx config not found"
    fi
else
    echo "⚠ Nginx is not running (may not be configured yet)"
fi
echo ""

# Check SSL
echo "6. Checking SSL:"
if [ -f "/etc/letsencrypt/live/crm.winstonacademy.co.uk/fullchain.pem" ]; then
    echo "✓ SSL certificate exists"
else
    echo "⚠ SSL certificate not found"
fi
echo ""

echo "=========================================="
echo "Quick Commands:"
echo "=========================================="
echo ""
echo "View logs:"
echo "  pm2 logs crm-backend"
echo "  pm2 logs crm-frontend"
echo ""
echo "Restart services:"
echo "  pm2 restart all"
echo ""
echo "Check specific service:"
echo "  pm2 describe crm-backend"
echo "  pm2 describe crm-frontend"
echo ""


