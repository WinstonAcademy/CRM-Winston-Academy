#!/bin/bash
set -e

echo "🔍 Checking repository structure..."
cd /var/www/crm

if [ ! -d "temp-repo" ]; then
    echo "❌ temp-repo doesn't exist. Cloning..."
    git clone git@github.com:niksom406/CRM-Winston-Academy.git temp-repo
fi

echo ""
echo "=== Repository structure ==="
ls -la temp-repo/

echo ""
echo "=== Looking for CRMWinston ==="
if [ -d "temp-repo/CRMWinston" ]; then
    echo "✅ CRMWinston directory found!"
    ls -la temp-repo/CRMWinston/ | head -20
else
    echo "❌ CRMWinston directory NOT found!"
    echo ""
    echo "Available directories:"
    find temp-repo -maxdepth 2 -type d | head -20
fi

echo ""
echo "=== Checking frontend directory before copy ==="
ls -la frontend/ | head -10

echo ""
echo "📋 Copying frontend files..."
if [ -d "temp-repo/CRMWinston" ]; then
    # Copy all files including hidden ones
    cp -r temp-repo/CRMWinston/. frontend/ 2>&1 || {
        echo "⚠️  Copy with dot failed, trying without dot..."
        cp -r temp-repo/CRMWinston/* frontend/ 2>&1
    }
    
    echo "✅ Copy command executed"
else
    echo "❌ Cannot copy - CRMWinston directory not found!"
    exit 1
fi

echo ""
echo "=== Checking frontend directory after copy ==="
ls -la frontend/ | head -20

echo ""
echo "=== Checking for package.json ==="
if [ -f "frontend/package.json" ]; then
    echo "✅ Frontend package.json found!"
    echo "First few lines:"
    head -5 frontend/package.json
else
    echo "❌ Frontend package.json NOT found!"
    echo ""
    echo "Searching for package.json in repository:"
    find temp-repo -name "package.json" -type f | head -5
fi

echo ""
echo "✅ Done!"

