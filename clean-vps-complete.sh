#!/bin/bash

# Complete VPS Cleanup Script
# Run this on your VPS to clean everything

echo "=========================================="
echo "Complete VPS Cleanup"
echo "=========================================="
echo ""

# Step 1: Backup corrupted files
echo "1. Backing up corrupted files..."
cp /etc/profile /etc/profile.backup.$(date +%Y%m%d)
cp /root/.bashrc /root/.bashrc.backup.$(date +%Y%m%d)
echo "   ✓ Backups created"
echo ""

# Step 2: Fix /etc/profile
echo "2. Fixing /etc/profile..."
# Remove all malicious code
sed -i '/\.update/d' /etc/profile
sed -i '/sleep 30/d' /etc/profile
sed -i '/done &/d' /etc/profile

# Check for syntax errors and fix common issues
if ! bash -n /etc/profile 2>/dev/null; then
    echo "   ⚠ Syntax errors found, attempting to fix..."
    # Remove lines with syntax errors
    sed -i '/^[[:space:]]*&[[:space:]]*$/d' /etc/profile
    sed -i '/^[[:space:]]*done[[:space:]]*&/d' /etc/profile
    # Ensure file ends properly
    if [ "$(tail -c 1 /etc/profile)" != "" ]; then
        echo "" >> /etc/profile
    fi
fi

# Verify
if bash -n /etc/profile 2>/dev/null; then
    echo "   ✓ /etc/profile fixed"
else
    echo "   ⚠ /etc/profile still has errors, restoring from backup and manual fix needed"
    cp /etc/profile.backup.$(date +%Y%m%d) /etc/profile
fi
echo ""

# Step 3: Fix .bashrc
echo "3. Fixing /root/.bashrc..."
# Remove all malicious code
sed -i '/\.update/d' /root/.bashrc
sed -i '/sleep 30/d' /root/.bashrc
sed -i '/done &/d' /root/.bashrc

# Check for syntax errors
if ! bash -n /root/.bashrc 2>/dev/null; then
    echo "   ⚠ Syntax errors found, attempting to fix..."
    # Remove lines with syntax errors
    sed -i '/^[[:space:]]*&[[:space:]]*$/d' /root/.bashrc
    sed -i '/^[[:space:]]*done[[:space:]]*&/d' /root/.bashrc
    # Ensure file ends properly
    if [ "$(tail -c 1 /root/.bashrc)" != "" ]; then
        echo "" >> /root/.bashrc
    fi
fi

# Verify
if bash -n /root/.bashrc 2>/dev/null; then
    echo "   ✓ /root/.bashrc fixed"
else
    echo "   ⚠ /root/.bashrc still has errors, restoring from backup and manual fix needed"
    cp /root/.bashrc.backup.$(date +%Y%m%d) /root/.bashrc
fi
echo ""

# Step 4: Remove any remaining malicious files
echo "4. Removing malicious files..."
rm -f /usr/bin/.update 2>/dev/null || true
find /tmp -name "*update*" -type f -delete 2>/dev/null || true
find /var/tmp -name "*update*" -type f -delete 2>/dev/null || true
echo "   ✓ Malicious files removed"
echo ""

# Step 5: Kill malicious processes
echo "5. Killing malicious processes..."
pkill -9 -f "sleep 30" 2>/dev/null || true
pkill -9 -f "\.update" 2>/dev/null || true
# Kill any processes with high sleep counts
ps aux | grep -E "sleep.*30" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
echo "   ✓ Malicious processes killed"
echo ""

# Step 6: Clean up PM2
echo "6. Cleaning PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
rm -rf ~/.pm2/logs/* 2>/dev/null || true
rm -f ~/.pm2/dump.pm2 2>/dev/null || true
echo "   ✓ PM2 cleaned"
echo ""

# Step 7: Remove application directories
echo "7. Removing application directories..."
rm -rf /var/www/crm 2>/dev/null || true
rm -rf /var/www/crm/backend 2>/dev/null || true
rm -rf /var/www/crm/frontend 2>/dev/null || true
rm -f /var/www/crm/ecosystem.config.js 2>/dev/null || true
rm -f /root/ecosystem.config.js 2>/dev/null || true
echo "   ✓ Application directories removed"
echo ""

# Step 8: Clean up ports
echo "8. Cleaning up ports..."
lsof -ti:1337 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
pkill -9 -f "strapi" 2>/dev/null || true
pkill -9 -f "next start" 2>/dev/null || true
echo "   ✓ Ports cleaned"
echo ""

# Step 9: Check for cron jobs
echo "9. Checking cron jobs..."
crontab -l 2>/dev/null | grep -v "^#" | grep -v "^$" | grep -E "\.update|sleep 30" && echo "   ⚠ Suspicious cron jobs found" || echo "   ✓ No suspicious cron jobs"
echo ""

# Step 10: Check systemd services
echo "10. Checking systemd services..."
systemctl list-units --type=service --state=running | grep -i update && echo "   ⚠ Suspicious services found" || echo "   ✓ No suspicious services"
echo ""

# Step 11: Verify cleanup
echo "11. Verifying cleanup..."
echo "   Checking for .update references:"
grep -r "\.update" /etc/profile /root/.bashrc 2>/dev/null && echo "   ⚠ Still found .update references" || echo "   ✓ No .update references found"

echo ""
echo "   Checking for sleep 30:"
grep -r "sleep 30" /etc/profile /root/.bashrc 2>/dev/null && echo "   ⚠ Still found sleep 30" || echo "   ✓ No sleep 30 found"

echo ""
echo "   Checking syntax:"
bash -n /etc/profile 2>&1 && echo "   ✓ /etc/profile syntax OK" || echo "   ⚠ /etc/profile has syntax errors"
bash -n /root/.bashrc 2>&1 && echo "   ✓ /root/.bashrc syntax OK" || echo "   ⚠ /root/.bashrc has syntax errors"
echo ""

echo "=========================================="
echo "Cleanup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Exit and reconnect to test: exit && ssh root@87.106.148.40"
echo "  2. If errors persist, manually edit files:"
echo "     nano /etc/profile"
echo "     nano /root/.bashrc"
echo "  3. Consider rebuilding VPS for complete security"
echo ""


