#!/bin/bash

# Complete VPS Wipe - Removes Everything
# WARNING: This will remove ALL application files and data
# Run this on your VPS

echo "=========================================="
echo "COMPLETE VPS WIPE"
echo "=========================================="
echo "WARNING: This will remove ALL files!"
echo ""

# Step 1: Stop all services
echo "1. Stopping all services..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true
systemctl stop mysql 2>/dev/null || true
systemctl stop postgresql 2>/dev/null || true
echo "   ✓ Services stopped"
echo ""

# Step 2: Kill all processes on application ports
echo "2. Killing processes on ports..."
lsof -ti:1337 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3306 | xargs kill -9 2>/dev/null || true
lsof -ti:5432 | xargs kill -9 2>/dev/null || true
pkill -9 -f "strapi" 2>/dev/null || true
pkill -9 -f "next start" 2>/dev/null || true
pkill -9 -f "node.*1337" 2>/dev/null || true
pkill -9 -f "node.*3000" 2>/dev/null || true
echo "   ✓ Port processes killed"
echo ""

# Step 3: Remove all application directories
echo "3. Removing application directories..."
rm -rf /var/www/crm
rm -rf /var/www/crm/backend
rm -rf /var/www/crm/frontend
rm -rf /var/www/crm/logs
rm -rf /var/www/*
rm -rf /var/www/html/*
echo "   ✓ Application directories removed"
echo ""

# Step 4: Remove PM2 completely
echo "4. Removing PM2..."
pm2 kill 2>/dev/null || true
rm -rf ~/.pm2
rm -rf /root/.pm2
rm -rf /home/*/.pm2
npm uninstall -g pm2 2>/dev/null || true
echo "   ✓ PM2 removed"
echo ""

# Step 5: Remove Node.js applications and caches
echo "5. Removing Node.js caches..."
rm -rf /tmp/node*
rm -rf /tmp/npm*
rm -rf /var/tmp/node*
rm -rf /var/tmp/npm*
rm -rf ~/.npm
rm -rf ~/.node*
echo "   ✓ Node.js caches removed"
echo ""

# Step 6: Remove malicious files and code
echo "6. Removing malicious files..."
rm -f /usr/bin/.update
rm -f /usr/local/bin/.update
rm -rf /tmp/*update*
rm -rf /var/tmp/*update*
find /tmp -name "*update*" -delete 2>/dev/null || true
find /var/tmp -name "*update*" -delete 2>/dev/null || true
find /root -name "*update*" -delete 2>/dev/null || true
echo "   ✓ Malicious files removed"
echo ""

# Step 7: Clean shell config files
echo "7. Cleaning shell config files..."
# Backup first
cp /etc/profile /etc/profile.backup.wipe 2>/dev/null || true
cp /root/.bashrc /root/.bashrc.backup.wipe 2>/dev/null || true

# Remove malicious code
sed -i '/\.update/d' /etc/profile 2>/dev/null || true
sed -i '/sleep 30/d' /etc/profile 2>/dev/null || true
sed -i '/done &/d' /etc/profile 2>/dev/null || true
sed -i '/^[[:space:]]*if[[:space:]]*$/d' /etc/profile 2>/dev/null || true
sed -i '/^[[:space:]]*then[[:space:]]*$/d' /etc/profile 2>/dev/null || true
sed -i '/^[[:space:]]*do[[:space:]]*$/d' /etc/profile 2>/dev/null || true
sed -i '/^[[:space:]]*&[[:space:]]*$/d' /etc/profile 2>/dev/null || true
sed -i '/^[[:space:]]*&&[[:space:]]*$/d' /etc/profile 2>/dev/null || true
sed -i '/^[[:space:]]*||[[:space:]]*$/d' /etc/profile 2>/dev/null || true

sed -i '/\.update/d' /root/.bashrc 2>/dev/null || true
sed -i '/sleep 30/d' /root/.bashrc 2>/dev/null || true
sed -i '/done &/d' /root/.bashrc 2>/dev/null || true
sed -i '/^[[:space:]]*if[[:space:]]*$/d' /root/.bashrc 2>/dev/null || true
sed -i '/^[[:space:]]*then[[:space:]]*$/d' /root/.bashrc 2>/dev/null || true
sed -i '/^[[:space:]]*do[[:space:]]*$/d' /root/.bashrc 2>/dev/null || true
sed -i '/^[[:space:]]*&[[:space:]]*$/d' /root/.bashrc 2>/dev/null || true
sed -i '/^[[:space:]]*&&[[:space:]]*$/d' /root/.bashrc 2>/dev/null || true
sed -i '/^[[:space:]]*||[[:space:]]*$/d' /root/.bashrc 2>/dev/null || true

# Fix file endings
echo "" >> /etc/profile 2>/dev/null || true
echo "" >> /root/.bashrc 2>/dev/null || true
echo "   ✓ Shell configs cleaned"
echo ""

# Step 8: Kill malicious processes
echo "8. Killing malicious processes..."
pkill -9 -f "sleep 30" 2>/dev/null || true
pkill -9 -f "\.update" 2>/dev/null || true
killall sleep 2>/dev/null || true
echo "   ✓ Malicious processes killed"
echo ""

# Step 9: Remove logs
echo "9. Removing logs..."
rm -rf /var/log/nginx/*.log 2>/dev/null || true
rm -rf /var/log/pm2* 2>/dev/null || true
rm -rf /var/www/crm/logs 2>/dev/null || true
rm -rf ~/logs 2>/dev/null || true
rm -rf /root/logs 2>/dev/null || true
echo "   ✓ Logs removed"
echo ""

# Step 10: Remove config files
echo "10. Removing config files..."
rm -f /var/www/crm/ecosystem.config.js 2>/dev/null || true
rm -f /root/ecosystem.config.js 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/crm* 2>/dev/null || true
rm -f /etc/nginx/sites-available/crm* 2>/dev/null || true
echo "   ✓ Config files removed"
echo ""

# Step 11: Clean temporary files
echo "11. Cleaning temporary files..."
rm -rf /tmp/*
rm -rf /var/tmp/*
rm -rf /root/tmp 2>/dev/null || true
echo "   ✓ Temporary files removed"
echo ""

# Step 12: Remove any remaining node processes
echo "12. Removing Node.js processes..."
pkill -9 node 2>/dev/null || true
pkill -9 npm 2>/dev/null || true
echo "   ✓ Node processes killed"
echo ""

# Step 13: Final verification
echo "13. Final verification..."
echo "   Checking /var/www:"
ls -la /var/www/ 2>/dev/null | head -5 || echo "   ✓ /var/www is empty or doesn't exist"

echo ""
echo "   Checking for malicious code:"
if grep -q "\.update\|sleep 30" /etc/profile /root/.bashrc 2>/dev/null; then
    echo "   ⚠ Still found some references"
else
    echo "   ✓ No malicious code found"
fi

echo ""
echo "   Checking PM2:"
pm2 list 2>/dev/null || echo "   ✓ PM2 not running"

echo ""
echo "   Checking ports:"
if lsof -ti:1337 > /dev/null 2>&1 || lsof -ti:3000 > /dev/null 2>&1; then
    echo "   ⚠ Ports still in use"
else
    echo "   ✓ Ports 1337 and 3000 are free"
fi

echo ""
echo "=========================================="
echo "VPS WIPE COMPLETE!"
echo "=========================================="
echo ""
echo "Everything has been removed:"
echo "  ✓ Applications (/var/www/crm)"
echo "  ✓ PM2 and processes"
echo "  ✓ Malicious files and code"
echo "  ✓ Logs and temporary files"
echo "  ✓ Config files"
echo ""
echo "VPS is now clean and ready for fresh deployment."
echo ""


