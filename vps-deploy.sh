#!/bin/bash
# vps-deploy.sh
# Deployment script to run on VPS after git pull

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Backend
echo ""
echo "📦 Updating Backend..."
cd /var/www/crm/backend
git pull origin main || echo "⚠️  Git pull failed, continuing with existing code..."
npm install --production
npm run build
pm2 restart crm-backend || pm2 start ecosystem.config.js --only crm-backend

# Frontend
echo ""
echo "📦 Updating Frontend..."
cd /var/www/crm/frontend
git pull origin main || echo "⚠️  Git pull failed, continuing with existing code..."
npm install --production
npm run build
pm2 restart crm-frontend || pm2 start ecosystem.config.js --only crm-frontend

echo ""
echo "✅ Deployment complete!"
pm2 status





