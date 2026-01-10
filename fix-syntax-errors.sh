#!/bin/bash

# Fix syntax errors in /etc/profile and /root/.bashrc
# Run this on your VPS

echo "=========================================="
echo "Fixing Syntax Errors"
echo "=========================================="
echo ""

# Step 1: Check what's wrong
echo "1. Checking syntax errors..."
bash -n /etc/profile 2>&1 | head -5
bash -n /root/.bashrc 2>&1 | head -5
echo ""

# Step 2: View problematic lines
echo "2. Viewing problematic areas..."
echo "--- /etc/profile around line 60 ---"
sed -n '55,65p' /etc/profile
echo ""
echo "--- /root/.bashrc around line 133 ---"
sed -n '128,138p' /root/.bashrc
echo ""

# Step 3: Fix /etc/profile
echo "3. Fixing /etc/profile..."
# Remove incomplete blocks - look for lines ending with { or if without closing
# Remove any lines that are clearly broken
sed -i '/^[[:space:]]*if[[:space:]]*$/d' /etc/profile
sed -i '/^[[:space:]]*then[[:space:]]*$/d' /etc/profile
sed -i '/^[[:space:]]*fi[[:space:]]*$/d' /etc/profile
sed -i '/^[[:space:]]*do[[:space:]]*$/d' /etc/profile
sed -i '/^[[:space:]]*done[[:space:]]*$/d' /etc/profile

# Remove lines that are just operators
sed -i '/^[[:space:]]*&[[:space:]]*$/d' /etc/profile
sed -i '/^[[:space:]]*&&[[:space:]]*$/d' /etc/profile
sed -i '/^[[:space:]]*||[[:space:]]*$/d' /etc/profile

# Ensure file ends with newline
if [ "$(tail -c 1 /etc/profile)" != "" ]; then
    echo "" >> /etc/profile
fi

# Remove any trailing incomplete statements
sed -i '$ { /^[[:space:]]*[&|;]/d }' /etc/profile

echo "   ✓ /etc/profile cleaned"
echo ""

# Step 4: Fix .bashrc
echo "4. Fixing /root/.bashrc..."
# Remove incomplete blocks
sed -i '/^[[:space:]]*if[[:space:]]*$/d' /root/.bashrc
sed -i '/^[[:space:]]*then[[:space:]]*$/d' /root/.bashrc
sed -i '/^[[:space:]]*fi[[:space:]]*$/d' /root/.bashrc
sed -i '/^[[:space:]]*do[[:space:]]*$/d' /root/.bashrc
sed -i '/^[[:space:]]*done[[:space:]]*$/d' /root/.bashrc

# Remove lines that are just operators
sed -i '/^[[:space:]]*&[[:space:]]*$/d' /root/.bashrc
sed -i '/^[[:space:]]*&&[[:space:]]*$/d' /root/.bashrc
sed -i '/^[[:space:]]*||[[:space:]]*$/d' /root/.bashrc

# Ensure file ends with newline
if [ "$(tail -c 1 /root/.bashrc)" != "" ]; then
    echo "" >> /root/.bashrc
fi

# Remove any trailing incomplete statements
sed -i '$ { /^[[:space:]]*[&|;]/d }' /root/.bashrc

echo "   ✓ /root/.bashrc cleaned"
echo ""

# Step 5: Test syntax again
echo "5. Testing syntax..."
if bash -n /etc/profile 2>/dev/null; then
    echo "   ✓ /etc/profile syntax OK"
else
    echo "   ✗ /etc/profile still has errors:"
    bash -n /etc/profile 2>&1 | head -3
fi

if bash -n /root/.bashrc 2>/dev/null; then
    echo "   ✓ /root/.bashrc syntax OK"
else
    echo "   ✗ /root/.bashrc still has errors:"
    bash -n /root/.bashrc 2>&1 | head -3
fi
echo ""

# Step 6: If still broken, show what to fix manually
if ! bash -n /etc/profile 2>/dev/null || ! bash -n /root/.bashrc 2>/dev/null; then
    echo "=========================================="
    echo "Manual Fix Required"
    echo "=========================================="
    echo ""
    echo "Files still have syntax errors. You may need to:"
    echo "  1. Restore from clean Ubuntu defaults, OR"
    echo "  2. Manually edit the files"
    echo ""
    echo "To restore /etc/profile:"
    echo "  cp /etc/profile.backup /etc/profile"
    echo "  # Then manually remove malicious lines"
    echo ""
    echo "To restore .bashrc:"
    echo "  cp /root/.bashrc.backup /root/.bashrc"
    echo "  # Then manually remove malicious lines"
    echo ""
fi

echo "=========================================="
echo "Done!"
echo "=========================================="


