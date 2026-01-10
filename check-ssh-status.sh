#!/bin/bash

# Script to check SSH status
# Run this IF you can access VPS via web console

echo "=========================================="
echo "SSH Service Diagnosis"
echo "=========================================="
echo ""

# Check SSH service status
echo "1. SSH Service Status:"
if systemctl is-active --quiet ssh 2>/dev/null || systemctl is-active --quiet sshd 2>/dev/null; then
    echo "   ✓ SSH service is running"
    systemctl status ssh 2>/dev/null || systemctl status sshd 2>/dev/null | head -10
else
    echo "   ✗ SSH service is NOT running"
    echo "   Attempting to start..."
    systemctl start ssh 2>/dev/null || systemctl start sshd 2>/dev/null
    sleep 2
    if systemctl is-active --quiet ssh 2>/dev/null || systemctl is-active --quiet sshd 2>/dev/null; then
        echo "   ✓ SSH service started successfully"
    else
        echo "   ✗ Failed to start SSH service"
    fi
fi
echo ""

# Check if SSH process is running
echo "2. SSH Process Check:"
SSH_PROC=$(ps aux | grep -E "[s]shd|[s]sh:" | grep -v grep)
if [ -n "$SSH_PROC" ]; then
    echo "   ✓ SSH process found:"
    echo "$SSH_PROC" | head -3
else
    echo "   ✗ No SSH process found"
fi
echo ""

# Check if port 22 is listening
echo "3. Port 22 Status:"
if command -v ss &> /dev/null; then
    PORT_22=$(ss -tlnp | grep :22)
    if [ -n "$PORT_22" ]; then
        echo "   ✓ Port 22 is listening:"
        echo "$PORT_22"
    else
        echo "   ✗ Port 22 is NOT listening"
    fi
elif command -v netstat &> /dev/null; then
    PORT_22=$(netstat -tlnp | grep :22)
    if [ -n "$PORT_22" ]; then
        echo "   ✓ Port 22 is listening:"
        echo "$PORT_22"
    else
        echo "   ✗ Port 22 is NOT listening"
    fi
else
    echo "   ⚠ Cannot check (ss and netstat not available)"
fi
echo ""

# Check firewall
echo "4. Firewall Status:"
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status | head -5)
    echo "$UFW_STATUS"
    if echo "$UFW_STATUS" | grep -q "22.*ALLOW"; then
        echo "   ✓ Port 22 is allowed in UFW"
    else
        echo "   ⚠ Port 22 may not be allowed"
        echo "   Run: ufw allow 22/tcp"
    fi
else
    echo "   ⚠ UFW not installed or not available"
fi
echo ""

# Check SSH configuration
echo "5. SSH Configuration:"
if [ -f "/etc/ssh/sshd_config" ]; then
    SSH_PORT=$(grep "^Port" /etc/ssh/sshd_config | awk '{print $2}' | head -1)
    if [ -n "$SSH_PORT" ] && [ "$SSH_PORT" != "22" ]; then
        echo "   ⚠ SSH is configured on port $SSH_PORT (not 22)"
    else
        echo "   ✓ SSH configured on port 22"
    fi
    
    PERMIT_ROOT=$(grep "^PermitRootLogin" /etc/ssh/sshd_config | awk '{print $2}' | head -1)
    echo "   PermitRootLogin: ${PERMIT_ROOT:-yes (default)}"
else
    echo "   ✗ SSH config file not found"
fi
echo ""

# Check recent SSH logs
echo "6. Recent SSH Logs (last 10 lines):"
if [ -f "/var/log/auth.log" ]; then
    tail -10 /var/log/auth.log | grep -i ssh | tail -5 || echo "   No recent SSH entries"
elif journalctl &> /dev/null; then
    journalctl -u ssh -n 5 2>/dev/null || journalctl -u sshd -n 5 2>/dev/null || echo "   No SSH service logs"
else
    echo "   ⚠ Cannot access logs"
fi
echo ""

# Summary and recommendations
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

if systemctl is-active --quiet ssh 2>/dev/null || systemctl is-active --quiet sshd 2>/dev/null; then
    echo "✓ SSH service appears to be running"
    echo ""
    echo "If you still can't connect:"
    echo "  1. Check firewall: ufw allow 22/tcp"
    echo "  2. Check SSH config: cat /etc/ssh/sshd_config"
    echo "  3. Restart SSH: systemctl restart ssh"
else
    echo "✗ SSH service is NOT running"
    echo ""
    echo "To restore SSH:"
    echo "  1. systemctl start ssh"
    echo "  2. systemctl enable ssh"
    echo "  3. ufw allow 22/tcp"
    echo "  4. systemctl restart ssh"
fi
echo ""


