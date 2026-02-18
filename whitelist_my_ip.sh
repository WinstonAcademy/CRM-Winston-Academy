#!/bin/bash

# Get the IP address of the computer connecting via SSH
CLIENT_IP=$(echo $SSH_CLIENT | awk '{print $1}')

if [ -z "$CLIENT_IP" ]; then
    echo "Error: Could not detect IP. Run this script via SSH!"
    exit 1
fi

echo "---- Whitelisting Your IP: $CLIENT_IP ----"

# 1. Allow in Firewall (UFW)
ufw allow from $CLIENT_IP to any comment 'Admin User Whitelist'
echo "✓ Added to Firewall allow list"

# 2. Unban from Fail2Ban (if present)
if command -v fail2ban-client &> /dev/null; then
    fail2ban-client set sshd unbanip $CLIENT_IP 2>/dev/null || true
    # fail2ban-client set sshd addignoreip $CLIENT_IP 2>/dev/null || true
    echo "✓ Added to Fail2Ban ignore list"
fi

echo "---- Success! Your IP ($CLIENT_IP) is now safe from bans. ----"
