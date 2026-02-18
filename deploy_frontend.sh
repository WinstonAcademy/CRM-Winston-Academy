#!/bin/bash
set -e

# Configuration
APP_DIR="/var/www/crm-winston/frontend"
REPO_URL="https://github.com/niksom406/CRM-Winston-Academy.git"
NEXT_SUBDIR="CRMWinston"
NODE_ENV="production"

echo "---- Starting Frontend Deployment ----"

mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Check if it's a git repo
if [ -d ".git" ]; then
    echo "Updating existing repository..."
    git pull origin main
else
    echo "Initializing repository..."
    git init
    git remote add origin "$REPO_URL"
    git fetch
    # Reset/Checkout to match remote main, but keep local .env (since it's gitignored)
    git checkout -B main origin/main
fi

# Navigate to Next.js directory
cd "$NEXT_SUBDIR"

# Install Dependencies
echo "Installing dependencies..."
npm install

# Build Application
echo "Building Next.js App..."
npm run build

# Start with PM2
echo "Starting with PM2..."
pm2 delete nextjs-frontend 2>/dev/null || true
pm2 start npm --name "nextjs-frontend" -- start

# Save PM2 list
pm2 save

echo "---- Frontend Deployment Complete ----"
