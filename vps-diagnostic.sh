#!/bin/bash

# VPS Diagnostic Script for crm.winstonacademy.co.uk
# Run this script on your VPS to diagnose issues

echo "=========================================="
echo "VPS Diagnostic for crm.winstonacademy.co.uk"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# 1. Check DNS Resolution
echo "1. Checking DNS Resolution..."
DNS_IP=$(dig +short crm.winstonacademy.co.uk | tail -1)
EXPECTED_IP="87.106.148.40"
if [ "$DNS_IP" = "$EXPECTED_IP" ]; then
    print_status 0 "DNS resolves to correct IP: $DNS_IP"
else
    print_status 1 "DNS issue: Resolves to $DNS_IP (Expected: $EXPECTED_IP)"
fi
echo ""

# 2. Check if PM2 is running
echo "2. Checking PM2 Status..."
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 list 2>/dev/null | grep -E "crm-backend|crm-frontend" | wc -l)
    if [ "$PM2_STATUS" -ge 2 ]; then
        print_status 0 "PM2 processes found"
        pm2 list | grep -E "crm-backend|crm-frontend"
    else
        print_status 1 "PM2 processes not running or not found"
        echo "Run: pm2 list"
    fi
else
    print_status 1 "PM2 not installed"
fi
echo ""

# 3. Check if ports are listening
echo "3. Checking Port Status..."
if netstat -tuln 2>/dev/null | grep -q ":1337"; then
    print_status 0 "Port 1337 (Backend) is listening"
else
    print_status 1 "Port 1337 (Backend) is NOT listening"
fi

if netstat -tuln 2>/dev/null | grep -q ":3000"; then
    print_status 0 "Port 3000 (Frontend) is listening"
else
    print_status 1 "Port 3000 (Frontend) is NOT listening"
fi
echo ""

# 4. Check Nginx Status
echo "4. Checking Nginx Status..."
if systemctl is-active --quiet nginx; then
    print_status 0 "Nginx is running"
else
    print_status 1 "Nginx is NOT running"
    echo "Run: systemctl status nginx"
fi

# Check Nginx config
if [ -f "/etc/nginx/sites-available/crm.winstonacademy.co.uk" ]; then
    print_status 0 "Nginx config file exists"
    if [ -L "/etc/nginx/sites-enabled/crm.winstonacademy.co.uk" ]; then
        print_status 0 "Nginx site is enabled"
    else
        print_status 1 "Nginx site is NOT enabled"
        echo "Run: ln -s /etc/nginx/sites-available/crm.winstonacademy.co.uk /etc/nginx/sites-enabled/"
    fi
else
    print_status 1 "Nginx config file NOT found"
fi

# Test Nginx config
if nginx -t 2>&1 | grep -q "successful"; then
    print_status 0 "Nginx configuration is valid"
else
    print_status 1 "Nginx configuration has errors"
    echo "Run: nginx -t"
fi
echo ""

# 5. Check SSL Certificate
echo "5. Checking SSL Certificate..."
if [ -f "/etc/letsencrypt/live/crm.winstonacademy.co.uk/fullchain.pem" ]; then
    print_status 0 "SSL certificate exists"
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/crm.winstonacademy.co.uk/fullchain.pem 2>/dev/null | cut -d= -f2)
    echo "   Certificate expires: $CERT_EXPIRY"
else
    print_status 1 "SSL certificate NOT found"
    echo "   Run: certbot --nginx -d crm.winstonacademy.co.uk"
fi
echo ""

# 6. Check Firewall
echo "6. Checking Firewall..."
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status | grep -i "active" | grep -i "yes")
    if [ -n "$UFW_STATUS" ]; then
        print_status 0 "Firewall is active"
        HTTP_ALLOWED=$(ufw status | grep -E "80/tcp|443/tcp" | grep -i "allow")
        if [ -n "$HTTP_ALLOWED" ]; then
            print_status 0 "Ports 80 and 443 are allowed"
        else
            print_status 1 "Ports 80/443 may not be allowed"
            echo "   Run: ufw allow 80/tcp && ufw allow 443/tcp"
        fi
    else
        print_status 1 "Firewall is not active (may be OK)"
    fi
fi
echo ""

# 7. Check Application Files
echo "7. Checking Application Files..."
if [ -d "/var/www/crm/backend" ]; then
    print_status 0 "Backend directory exists"
    if [ -f "/var/www/crm/backend/.env" ]; then
        print_status 0 "Backend .env file exists"
    else
        print_status 1 "Backend .env file NOT found"
    fi
    if [ -f "/var/www/crm/backend/package.json" ]; then
        print_status 0 "Backend package.json exists"
    else
        print_status 1 "Backend package.json NOT found"
    fi
else
    print_status 1 "Backend directory NOT found"
fi

if [ -d "/var/www/crm/frontend" ]; then
    print_status 0 "Frontend directory exists"
    if [ -f "/var/www/crm/frontend/.env.production" ]; then
        print_status 0 "Frontend .env.production exists"
    else
        print_status 1 "Frontend .env.production NOT found"
    fi
    if [ -f "/var/www/crm/frontend/package.json" ]; then
        print_status 0 "Frontend package.json exists"
    else
        print_status 1 "Frontend package.json NOT found"
    fi
else
    print_status 1 "Frontend directory NOT found"
fi
echo ""

# 8. Test Local Connections
echo "8. Testing Local Connections..."
if curl -s http://localhost:1337 > /dev/null 2>&1; then
    print_status 0 "Backend responds on localhost:1337"
else
    print_status 1 "Backend does NOT respond on localhost:1337"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_status 0 "Frontend responds on localhost:3000"
else
    print_status 1 "Frontend does NOT respond on localhost:3000"
fi
echo ""

# 9. Check Recent PM2 Logs
echo "9. Recent PM2 Logs (last 10 lines)..."
if command -v pm2 &> /dev/null; then
    echo "--- Backend Logs ---"
    pm2 logs crm-backend --lines 5 --nostream 2>/dev/null || echo "No backend logs"
    echo ""
    echo "--- Frontend Logs ---"
    pm2 logs crm-frontend --lines 5 --nostream 2>/dev/null || echo "No frontend logs"
fi
echo ""

# 10. Summary and Recommendations
echo "=========================================="
echo "Summary and Next Steps"
echo "=========================================="
echo ""
echo "If services are not running:"
echo "  1. cd /var/www/crm/backend && npm run build && pm2 restart crm-backend"
echo "  2. cd /var/www/crm/frontend && npm run build && pm2 restart crm-frontend"
echo ""
echo "If Nginx is not configured:"
echo "  1. Create /etc/nginx/sites-available/crm.winstonacademy.co.uk"
echo "  2. Enable: ln -s /etc/nginx/sites-available/crm.winstonacademy.co.uk /etc/nginx/sites-enabled/"
echo "  3. Test: nginx -t"
echo "  4. Reload: systemctl reload nginx"
echo ""
echo "If SSL is missing:"
echo "  1. certbot --nginx -d crm.winstonacademy.co.uk"
echo ""
echo "To view full logs:"
echo "  pm2 logs"
echo "  journalctl -u nginx -n 50"
echo ""


