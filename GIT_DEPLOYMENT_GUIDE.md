# Git-Based Deployment Guide

## Overview

This guide walks you through deploying your CRM application to VPS using Git. This approach allows you to:
- Version control your code
- Easy rollbacks
- Track changes
- Deploy updates with `git pull`

---

## Step 1: Clean Up VPS

### Option A: Using the cleanup script

Run on your local machine:
```bash
chmod +x cleanup-vps.sh
./cleanup-vps.sh
```

### Option B: Manual cleanup

SSH into your VPS:
```bash
ssh root@87.106.148.40
```

Then run:
```bash
# Stop PM2 processes
pm2 stop all
pm2 delete all

# Remove existing files
rm -rf /var/www/crm/backend/*
rm -rf /var/www/crm/frontend/*
rm -rf /var/www/crm/logs/*

# Remove PM2 config (we'll recreate it)
rm -f /var/www/crm/ecosystem.config.js

# Verify cleanup
ls -la /var/www/crm/backend/
ls -la /var/www/crm/frontend/
```

---

## Step 2: Initialize Git Repository (Local)

If you haven't already, initialize Git in your project root:

```bash
cd /Users/nikitasomani/Downloads/Win

# Initialize Git (if not already done)
git init

# Add remote repository
git remote add origin https://github.com/niksom406/CRM-Winston-Academy.git

# Add all files
git add .

# Commit
git commit -m "Initial commit - Winston Academy CRM"

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 3: Set Up Git on VPS

SSH into VPS:
```bash
ssh root@87.106.148.40
```

Install Git (if not installed):
```bash
apt update
apt install -y git
```

Configure Git (optional):
```bash
git config --global user.name "VPS Deploy"
git config --global user.email "deploy@winstonacademy.co.uk"
```

---

## Step 4: Clone Repository on VPS

```bash
# Navigate to parent directory
cd /var/www/crm

# Clone backend
git clone https://github.com/niksom406/CRM-Winston-Academy.git backend-temp
mv backend-temp/WinstonCRM-strapi/winston-crm/* backend/
rm -rf backend-temp

# Clone frontend
git clone https://github.com/niksom406/CRM-Winston-Academy.git frontend-temp
mv frontend-temp/CRMWinston/* frontend/
rm -rf frontend-temp
```

**OR** (Better approach - clone into separate directories first):

```bash
cd /var/www/crm

# Clone to temporary location
git clone https://github.com/niksom406/CRM-Winston-Academy.git temp-repo

# Copy backend
cp -r temp-repo/WinstonCRM-strapi/winston-crm/* backend/

# Copy frontend
cp -r temp-repo/CRMWinston/* frontend/

# Remove temp repo
rm -rf temp-repo
```

---

## Step 5: Set Up Environment Files on VPS

### Backend `.env`

```bash
cd /var/www/crm/backend
nano .env
```

Paste:
```env
HOST=0.0.0.0
PORT=1337
FRONTEND_URL=https://crm.winstonacademy.co.uk
EMAIL_PROVIDER=smtp
SMTP_HOST=mail.name.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=info@winstonacademy.co.uk
SMTP_PASSWORD=Winston@2025
EMAIL_FROM=info@winstonacademy.co.uk
EMAIL_REPLY_TO=info@winstonacademy.co.uk
APP_KEYS=W0Sgpe2B2AnB3KE5E5sidA==,1PP29CRdUvd3pdvaNSS1eQ==,/vhlXwBk2LL+vGqKYXDlwA==,1EM7s53VHePI/GrXHOOsRQ==
API_TOKEN_SALT=G3DXK06FKg0KrWYlvY8/oA==
ADMIN_JWT_SECRET=miZxhHkYTGCYg/bCrB63Cg==
TRANSFER_TOKEN_SALT=k6WqRwcTtuvV0A1rTHpMgQ==
ENCRYPTION_KEY=xhdvT+XIEuRwcL27UWqb0w==
JWT_SECRET=+9mjBaJRF/htb9Lm4Fppaw==
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

### Frontend `.env.production`

```bash
cd /var/www/crm/frontend
nano .env.production
```

Paste:
```env
NEXT_PUBLIC_STRAPI_URL=https://crm.winstonacademy.co.uk/api
NODE_ENV=production
```

---

## Step 6: Install Dependencies and Build

### Backend

```bash
cd /var/www/crm/backend
npm install
npm run build
```

### Frontend

```bash
cd /var/www/crm/frontend
npm install
npm run build
```

---

## Step 7: Create PM2 Ecosystem File

```bash
cd /var/www/crm
nano ecosystem.config.js
```

Paste:
```javascript
module.exports = {
  apps: [
    {
      name: 'crm-backend',
      cwd: '/var/www/crm/backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 1337
      },
      error_file: '/var/www/crm/logs/backend-error.log',
      out_file: '/var/www/crm/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'crm-frontend',
      cwd: '/var/www/crm/frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/www/crm/logs/frontend-error.log',
      out_file: '/var/www/crm/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

---

## Step 8: Create Logs Directory

```bash
mkdir -p /var/www/crm/logs
```

---

## Step 9: Start Applications

```bash
cd /var/www/crm
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Follow the command it outputs
```

---

## Step 10: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs

# Test backend
curl http://localhost:1337/api/users-permissions/auth/forgot-password

# Test frontend
curl http://localhost:3000
```

---

## Ongoing Deployment Workflow

### When you make changes locally:

1. **Make changes** in your local code
2. **Test locally** (`npm run dev` / `npm run develop`)
3. **Commit changes**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```
4. **Deploy to VPS** (SSH into VPS and run):
   ```bash
   cd /var/www/crm
   ./deploy.sh
   ```

---

## Create Deployment Script on VPS

Create `/var/www/crm/deploy.sh`:

```bash
#!/bin/bash
# deploy.sh - Git-based deployment script for VPS

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Backend
echo ""
echo "📦 Updating Backend..."
cd /var/www/crm/backend
git pull origin main
npm install --production
npm run build
pm2 restart crm-backend

# Frontend
echo ""
echo "📦 Updating Frontend..."
cd /var/www/crm/frontend
git pull origin main
npm install --production
npm run build
pm2 restart crm-frontend

echo ""
echo "✅ Deployment complete!"
pm2 status
```

Make it executable:
```bash
chmod +x /var/www/crm/deploy.sh
```

---

## Important Notes

1. **Environment Files**: `.env` files are in `.gitignore`, so they won't be overwritten by `git pull`
2. **Database**: `.tmp/data.db` is in `.gitignore`, so your data is safe
3. **Uploads**: `public/uploads/*` is in `.gitignore`, so uploaded files are preserved
4. **Node Modules**: `node_modules` is in `.gitignore`, so you need to run `npm install` after each `git pull`

---

## Troubleshooting

### Git pull fails

```bash
# If you have local changes, stash them
cd /var/www/crm/backend
git stash
git pull origin main
git stash pop
```

### PM2 not restarting

```bash
pm2 restart all
# Or
pm2 delete all
pm2 start ecosystem.config.js
```

### Build fails

```bash
# Clean and rebuild
rm -rf node_modules
npm install
npm run build
```

---

## Quick Reference

```bash
# Deploy updates
cd /var/www/crm && ./deploy.sh

# Check status
pm2 status
pm2 logs

# Restart apps
pm2 restart all

# View logs
pm2 logs crm-backend
pm2 logs crm-frontend
```





