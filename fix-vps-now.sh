#!/bin/bash

# Complete VPS Fix Script - Copy and paste this entire script into your VPS terminal

echo "=========================================="
echo "Complete VPS Fix"
echo "=========================================="
echo ""

# Backup files
echo "1. Backing up files..."
cp /etc/profile /etc/profile.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
cp /root/.bashrc /root/.bashrc.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
echo "   ✓ Backups created"
echo ""

# Fix /etc/profile - remove all malicious code and incomplete blocks
echo "2. Fixing /etc/profile..."
sed -i '/\.update/d' /etc/profile
sed -i '/sleep 30/d' /etc/profile
sed -i '/done &/d' /etc/profile
sed -i '/^[[:space:]]*if[[:space:]]*$/d' /etc/profile
sed -i '/^[[:space:]]*then[[:space:]]*$/d' /etc/profile
sed -i '/^[[:space:]]*do[[:space:]]*$/d' /etc/profile
sed -i '/^[[:space:]]*&[[:space:]]*$/d' /etc/profile
sed -i '/^[[:space:]]*&&[[:space:]]*$/d' /etc/profile
sed -i '/^[[:space:]]*||[[:space:]]*$/d' /etc/profile
# Remove trailing incomplete statements
sed -i '$ { /^[[:space:]]*[&|;]/d }' /etc/profile
# Ensure file ends with newline
echo "" >> /etc/profile
echo "   ✓ /etc/profile cleaned"
echo ""

# Fix .bashrc - remove all malicious code and incomplete blocks
echo "3. Fixing /root/.bashrc..."
sed -i '/\.update/d' /root/.bashrc
sed -i '/sleep 30/d' /root/.bashrc
sed -i '/done &/d' /root/.bashrc
sed -i '/^[[:space:]]*if[[:space:]]*$/d' /root/.bashrc
sed -i '/^[[:space:]]*then[[:space:]]*$/d' /root/.bashrc
sed -i '/^[[:space:]]*do[[:space:]]*$/d' /root/.bashrc
sed -i '/^[[:space:]]*&[[:space:]]*$/d' /root/.bashrc
sed -i '/^[[:space:]]*&&[[:space:]]*$/d' /root/.bashrc
sed -i '/^[[:space:]]*||[[:space:]]*$/d' /root/.bashrc
# Remove trailing incomplete statements
sed -i '$ { /^[[:space:]]*[&|;]/d }' /root/.bashrc
# Ensure file ends with newline
echo "" >> /root/.bashrc
echo "   ✓ /root/.bashrc cleaned"
echo ""

# Remove malicious files
echo "4. Removing malicious files..."
rm -f /usr/bin/.update 2>/dev/null || true
find /tmp -name "*update*" -delete 2>/dev/null || true
find /var/tmp -name "*update*" -delete 2>/dev/null || true
echo "   ✓ Malicious files removed"
echo ""

# Kill malicious processes
echo "5. Killing malicious processes..."
pkill -9 -f "sleep 30" 2>/dev/null || true
pkill -9 -f "\.update" 2>/dev/null || true
echo "   ✓ Processes killed"
echo ""

# Clean PM2
echo "6. Cleaning PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
rm -rf ~/.pm2/logs/* 2>/dev/null || true
rm -f ~/.pm2/dump.pm2 2>/dev/null || true
echo "   ✓ PM2 cleaned"
echo ""

# Remove applications
echo "7. Removing applications..."
rm -rf /var/www/crm 2>/dev/null || true
rm -f /var/www/crm/ecosystem.config.js 2>/dev/null || true
rm -f /root/ecosystem.config.js 2>/dev/null || true
echo "   ✓ Applications removed"
echo ""

# Clean ports
echo "8. Cleaning ports..."
lsof -ti:1337 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -9 -f "strapi" 2>/dev/null || true
pkill -9 -f "next start" 2>/dev/null || true
echo "   ✓ Ports cleaned"
echo ""

# Test syntax
echo "9. Testing syntax..."
if bash -n /etc/profile 2>/dev/null; then
    echo "   ✓ /etc/profile syntax OK"
else
    echo "   ✗ /etc/profile has syntax errors"
    echo "   Attempting additional fix..."
    # Try to fix by removing lines around error
    LINE_NUM=$(bash -n /etc/profile 2>&1 | grep -oP 'line \K[0-9]+' | head -1)
    if [ -n "$LINE_NUM" ]; then
        sed -i "${LINE_NUM}d" /etc/profile
        echo "" >> /etc/profile
    fi
    bash -n /etc/profile 2>/dev/null && echo "   ✓ Fixed!" || echo "   ⚠ May need manual fix"
fi

if bash -n /root/.bashrc 2>/dev/null; then
    echo "   ✓ /root/.bashrc syntax OK"
else
    echo "   ✗ /root/.bashrc has syntax errors"
    echo "   Attempting additional fix..."
    LINE_NUM=$(bash -n /root/.bashrc 2>&1 | grep -oP 'line \K[0-9]+' | head -1)
    if [ -n "$LINE_NUM" ]; then
        sed -i "${LINE_NUM}d" /root/.bashrc
        echo "" >> /root/.bashrc
    fi
    bash -n /root/.bashrc 2>/dev/null && echo "   ✓ Fixed!" || echo "   ⚠ May need manual fix"
fi
echo ""

# Final verification
echo "10. Final verification..."
echo "   Checking for malicious code:"
if grep -q "\.update\|sleep 30" /etc/profile /root/.bashrc 2>/dev/null; then
    echo "   ⚠ Still found malicious code"
    grep -n "\.update\|sleep 30" /etc/profile /root/.bashrc 2>/dev/null | head -5
else
    echo "   ✓ No malicious code found"
fi

echo ""
echo "   Checking applications:"
if [ -d "/var/www/crm" ]; then
    echo "   ⚠ /var/www/crm still exists"
else
    echo "   ✓ /var/www/crm removed"
fi

echo ""
echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Exit and reconnect: exit && ssh root@87.106.148.40"
echo "  2. You should NOT see any errors"
echo "  3. If errors persist, restore from backups and clean manually"
echo ""


