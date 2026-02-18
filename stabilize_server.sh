#!/bin/bash
set -e

echo "---- 🛡️ Stabilizing Server (Adding Swap) 🛡️ ----"

# Check if swap exists
if free | awk '/^Swap:/ {exit !$2}'; then
    echo "✅ Swap already exists."
else
    echo "⚠️ No Swap found. Creating 4GB Swap file..."
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
    echo "✅ Swap created successfully."
fi

# Show memory status
echo "Current Memory Status:"
free -h

echo "---- 🛡️ Server Stabilized! 🛡️ ----"
