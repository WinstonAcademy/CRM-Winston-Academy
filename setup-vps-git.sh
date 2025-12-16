#!/bin/bash
# setup-vps-git.sh
# Script to set up Git-based deployment on VPS
# Run this ONCE on your VPS after cleaning it

set -e

VPS_BACKEND="/var/www/crm/backend"
VPS_FRONTEND="/var/www/crm/frontend"
REPO_URL="https://github.com/niksom406/CRM-Winston-Academy.git"

echo "🔧 Setting up Git-based deployment on VPS..."
echo ""

# Install Git if not installed
if ! command -v git &> /dev/null; then
    echo "📦 Installing Git..."
    apt update
    apt install -y git
fi

# Create temp directory for cloning
TEMP_DIR="/tmp/crm-repo-$(date +%s)"
mkdir -p $TEMP_DIR

echo "📥 Cloning repository..."
cd $TEMP_DIR
git clone $REPO_URL .

echo "📋 Copying backend files..."
mkdir -p $VPS_BACKEND
cp -r WinstonCRM-strapi/winston-crm/* $VPS_BACKEND/

echo "📋 Copying frontend files..."
mkdir -p $VPS_FRONTEND
cp -r CRMWinston/* $VPS_FRONTEND/

echo "🧹 Cleaning up temp files..."
rm -rf $TEMP_DIR

echo "📝 Setting up Git repositories in app directories..."

# Initialize Git repos in backend and frontend
cd $VPS_BACKEND
git init
git remote add origin $REPO_URL
git fetch origin
git checkout -b main origin/main || git checkout main

cd $VPS_FRONTEND
git init
git remote add origin $REPO_URL
git fetch origin
git checkout -b main origin/main || git checkout main

echo ""
echo "✅ Git setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create .env files (see GIT_DEPLOYMENT_GUIDE.md)"
echo "2. Install dependencies: cd $VPS_BACKEND && npm install"
echo "3. Install dependencies: cd $VPS_FRONTEND && npm install"
echo "4. Build applications"
echo "5. Set up PM2 (see GIT_DEPLOYMENT_GUIDE.md)"

