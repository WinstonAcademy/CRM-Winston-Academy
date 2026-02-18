#!/bin/bash
set -e

# Configuration
APP_DIR="/var/www/crm-winston/backend"
REPO_URL="https://github.com/niksom406/CRM-Winston-Academy.git"
STRAPI_SUBDIR="WinstonCRM-strapi/winston-crm"
NODE_ENV="production"

echo "---- Starting Backend Deployment ----"

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

# Navigate to Strapi directory
cd "$STRAPI_SUBDIR"

# Install Dependencies
echo "Installing dependencies..."
npm install

# Build Admin Panel
echo "Building Strapi Admin..."
NODE_ENV=$NODE_ENV npm run build

# Start with PM2
echo "Starting with PM2..."
pm2 delete strapi-backend 2>/dev/null || true
pm2 start npm --name "strapi-backend" -- start

# Save PM2 list
pm2 save

echo "---- Backend Deployment Complete ----"
