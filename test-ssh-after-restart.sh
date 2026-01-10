#!/bin/bash

# Test SSH connection after VPS restart
# Run this from your local machine

echo "Testing SSH connection to VPS..."
echo ""

# Test connection
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@87.106.148.40 "echo 'SSH connection successful!'" 2>/dev/null; then
    echo "✓ SSH connection is working!"
    echo ""
    echo "You can now connect with:"
    echo "  ssh root@87.106.148.40"
    echo ""
    echo "Once connected, run the removal commands:"
    echo "  pm2 stop all && pm2 delete all && pm2 kill && rm -rf /var/www/crm"
else
    echo "✗ SSH connection still not working"
    echo ""
    echo "Possible reasons:"
    echo "  1. VPS is still starting up (wait 2-3 minutes)"
    echo "  2. SSH service needs to be started"
    echo "  3. Firewall is blocking port 22"
    echo ""
    echo "Try again in a few minutes, or use Ionos web console"
fi


