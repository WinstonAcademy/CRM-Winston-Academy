#!/bin/bash
set -e

echo "---- 🚑 STARTING REPAIR v3 (Path Fix) 🚑 ----"

# 1. Stop Backend to free up RAM
echo "1. Stopping Backend..."
pm2 stop strapi-backend || true

# 2. Update Code (Status Check)
echo "2. Pulling latest code..."
cd /var/www/crm-winston/frontend
git stash
git pull origin main

# 3. Configure Env for INTERNAL Communication
# We need to set this INSIDE the Next.js project folder
echo "3. Updating Environment..."
cd CRMWinston  # <--- CRITICAL FIX: Go into the actual project folder
echo "NEXT_PUBLIC_STRAPI_URL=http://127.0.0.1:1337" > .env.local

# 4. Build Frontend (Low Memory Mode)
echo "4. Building Frontend (please wait)..."
export NODE_OPTIONS="--max-old-space-size=1536"
rm -rf .next
npm run build

# 5. Restart Services
echo "5. Restarting All Services..."
pm2 restart all

echo "---- ✅ REPAIR COMPLETE! ----"
