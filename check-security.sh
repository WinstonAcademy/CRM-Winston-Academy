#!/bin/bash

# Security Check Script
# Run this to assess the security situation

echo "=========================================="
echo "Security Assessment"
echo "=========================================="
echo ""

# Check for .update file
echo "1. Checking for malicious .update file..."
if [ -f "/usr/bin/.update" ]; then
    echo "   ✗ MALICIOUS FILE FOUND: /usr/bin/.update"
    echo "   This is a known backdoor!"
else
    echo "   ✓ /usr/bin/.update not found"
fi
echo ""

# Check .bashrc for suspicious content
echo "2. Checking .bashrc for malicious code..."
if grep -q "/usr/bin/.update" /root/.bashrc 2>/dev/null; then
    echo "   ✗ MALICIOUS CODE FOUND in .bashrc"
    echo "   Lines containing .update:"
    grep -n "/usr/bin/.update" /root/.bashrc
else
    echo "   ✓ No .update references in .bashrc"
fi

if grep -q "sleep 30" /root/.bashrc 2>/dev/null; then
    SLEEP_COUNT=$(grep -c "sleep 30" /root/.bashrc)
    echo "   ⚠ Found $SLEEP_COUNT 'sleep 30' commands in .bashrc (suspicious)"
else
    echo "   ✓ No suspicious sleep commands in .bashrc"
fi
echo ""

# Check /etc/profile
echo "3. Checking /etc/profile for malicious code..."
if grep -q "/usr/bin/.update" /etc/profile 2>/dev/null; then
    echo "   ✗ MALICIOUS CODE FOUND in /etc/profile"
    echo "   Lines containing .update:"
    grep -n "/usr/bin/.update" /etc/profile
else
    echo "   ✓ No .update references in /etc/profile"
fi

if grep -q "sleep 30" /etc/profile 2>/dev/null; then
    SLEEP_COUNT=$(grep -c "sleep 30" /etc/profile)
    echo "   ⚠ Found $SLEEP_COUNT 'sleep 30' commands in /etc/profile (suspicious)"
else
    echo "   ✓ No suspicious sleep commands in /etc/profile"
fi
echo ""

# Check for suspicious processes
echo "4. Checking for suspicious processes..."
SLEEP_PROCS=$(ps aux | grep -c "[s]leep 30")
if [ "$SLEEP_PROCS" -gt 10 ]; then
    echo "   ✗ Found $SLEEP_PROCS 'sleep 30' processes (suspicious)"
else
    echo "   ✓ No excessive sleep processes"
fi

ZOMBIE_COUNT=$(ps aux | grep -c "[Zz]ombie")
if [ "$ZOMBIE_COUNT" -gt 50 ]; then
    echo "   ✗ Found $ZOMBIE_COUNT zombie processes (very suspicious)"
else
    echo "   ✓ Zombie process count normal"
fi
echo ""

# Check cron jobs
echo "5. Checking cron jobs..."
if [ -f "/etc/crontab" ]; then
    if grep -q ".update\|sleep 30" /etc/crontab 2>/dev/null; then
        echo "   ✗ Suspicious cron jobs found"
        grep ".update\|sleep 30" /etc/crontab
    else
        echo "   ✓ No suspicious cron jobs"
    fi
fi
echo ""

# Check recent logins
echo "6. Recent SSH logins (last 10):"
last -10 | head -10
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "If malicious code was found:"
echo "  1. BACKUP your application files: /var/www/crm"
echo "  2. Consider rebuilding the VPS"
echo "  3. Change ALL passwords"
echo "  4. Review SSH access logs"
echo ""
echo "To clean up:"
echo "  1. Remove malicious lines from .bashrc and /etc/profile"
echo "  2. Kill suspicious processes"
echo "  3. Run security scans"
echo ""


