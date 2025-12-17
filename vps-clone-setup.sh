#!/bin/bash
set -e

echo "🚀 Setting up CRM on VPS..."
echo ""

# Check if token is provided
if [ -z "$1" ]; then
    echo "❌ Error: GitHub Personal Access Token required"
    echo ""
    echo "Usage: $0 YOUR_GITHUB_TOKEN"
    echo ""
    echo "To create a token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token' → 'Generate new token (classic)'"
    echo "3. Name it: 'VPS Deployment'"
    echo "4. Check 'repo' scope"
    echo "5. Generate and copy the token"
    echo ""
    exit 1
fi

GITHUB_TOKEN=$1
REPO_URL="https://${GITHUB_TOKEN}@github.com/niksom406/CRM-Winston-Academy.git"

cd /var/www/crm

echo "📦 Step 1: Cleaning up existing Git repos..."
rm -rf backend/.git frontend/.git temp-repo

echo "📥 Step 2: Cloning repository..."
git clone "$REPO_URL" temp-repo

if [ ! -d "temp-repo" ]; then
    echo "❌ Clone failed! Check your token."
    exit 1
fi

echo "✅ Clone successful!"
echo ""

echo "📋 Step 3: Copying backend files..."
if [ -d "temp-repo/WinstonCRM-strapi/winston-crm" ]; then
    cp -r temp-repo/WinstonCRM-strapi/winston-crm/* backend/
    echo "✅ Backend files copied"
else
    echo "❌ Backend directory not found in repository!"
    exit 1
fi

echo "📋 Step 4: Copying frontend files..."
if [ -d "temp-repo/CRMWinston" ]; then
    cp -r temp-repo/CRMWinston/* frontend/
    echo "✅ Frontend files copied"
else
    echo "❌ Frontend directory not found in repository!"
    exit 1
fi

echo "🧹 Step 5: Cleaning up..."
rm -rf temp-repo

echo "🔧 Step 6: Setting up Git remotes..."
cd backend
git init
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
git fetch origin
git checkout -b main origin/main 2>/dev/null || echo "Already on main branch"

cd ../frontend
git init
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
git fetch origin
git checkout -b main origin/main 2>/dev/null || echo "Already on main branch"

cd /var/www/crm

echo ""
echo "✅ Setup complete!"
echo ""
echo "📦 Next steps:"
echo "1. Install dependencies:"
echo "   cd /var/www/crm/backend && npm install"
echo "   cd /var/www/crm/frontend && npm install"
echo ""
echo "2. Build applications:"
echo "   cd /var/www/crm/backend && npm run build"
echo "   cd /var/www/crm/frontend && npm run build"
echo ""
echo "3. Start with PM2 (see ecosystem.config.js setup)"

