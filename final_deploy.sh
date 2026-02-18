#!/bin/bash
set -e

echo "---- ☢️ STARTING FINAL DEPLOY PROCEDURE ☢️ ----"

# 1. Kill Everything (Nuclear option)
echo "1. Killing old processes..."
pm2 stop all || true
killall -9 node || true
# Wait a moment for memory to free up
sleep 3

# 2. Check Memory
echo "Memory Status:"
free -h

# 3. Go to Frontend Project
cd /var/www/crm-winston/frontend/CRMWinston

# 4. Clean Install (Fix corruption)
echo "2. Cleaning & Reinstalling Dependencies..."
rm -rf .next node_modules package-lock.json
npm install

# 5. Build (High Memory Mode since we have 8GB)
echo "3. Building Frontend (Allocating 4GB RAM)..."
export NEXT_PUBLIC_STRAPI_URL=http://127.0.0.1:1337
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# 6. Restart Services
echo "4. Restarting Services..."
# Backend
cd /var/www/crm-winston/backend/WinstonCRM-strapi/winston-crm
pm2 delete strapi-backend || true
pm2 start npm --name "strapi-backend" -- run start

# Frontend
cd /var/www/crm-winston/frontend/CRMWinston
pm2 delete nextjs-frontend || true
pm2 start npm --name "nextjs-frontend" -- run start

pm2 save
echo "---- 🚀 DEPLOY SUCCESS! ----"
