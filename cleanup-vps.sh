#!/bin/bash
# cleanup-vps.sh
# Script to clean up VPS before Git-based deployment

VPS_USER="root"
VPS_IP="87.106.148.40"

echo "🧹 Cleaning up VPS..."
echo ""
echo "⚠️  WARNING: This will delete all existing files in /var/www/crm/"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo ""
echo "📋 Commands to run on VPS:"
echo ""
echo "SSH into VPS first:"
echo "  ssh $VPS_USER@$VPS_IP"
echo ""
echo "Then run these commands:"
echo ""
echo "# Stop PM2 processes"
echo "pm2 stop all"
echo "pm2 delete all"
echo ""
echo "# Remove existing files"
echo "rm -rf /var/www/crm/backend/*"
echo "rm -rf /var/www/crm/frontend/*"
echo "rm -rf /var/www/crm/logs/*"
echo "rm -f /var/www/crm/ecosystem.config.js"
echo ""
echo "# Verify cleanup"
echo "ls -la /var/www/crm/backend/"
echo "ls -la /var/www/crm/frontend/"
echo ""
echo "✅ VPS cleaned! Ready for Git deployment."





