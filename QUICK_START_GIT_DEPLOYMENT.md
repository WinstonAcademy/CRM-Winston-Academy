# Quick Start: Git-Based Deployment

## 🚀 Quick Setup (5 Steps)

### Step 1: Clean VPS

SSH into VPS and run:
```bash
ssh root@87.106.148.40

# Stop PM2
pm2 stop all
pm2 delete all

# Clean files
rm -rf /var/www/crm/backend/*
rm -rf /var/www/crm/frontend/*
```

---

### Step 2: Push Code to GitHub (Local)

On your Mac:
```bash
cd /Users/nikitasomani/Downloads/Win

# Initialize Git (if not done)
git init
git remote add origin https://github.com/niksom406/CRM-Winston-Academy.git

# Add and commit
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```

---

### Step 3: Clone on VPS

On VPS:
```bash
cd /var/www/crm

# Clone repo
git clone https://github.com/niksom406/CRM-Winston-Academy.git temp-repo

# Copy backend
cp -r temp-repo/WinstonCRM-strapi/winston-crm/* backend/

# Copy frontend
cp -r temp-repo/CRMWinston/* frontend/

# Clean up
rm -rf temp-repo

# Initialize Git in app directories
cd backend
git init
git remote add origin https://github.com/niksom406/CRM-Winston-Academy.git
cd ../frontend
git init
git remote add origin https://github.com/niksom406/CRM-Winston-Academy.git
```

---

### Step 4: Set Up Environment Files

**Backend `.env`:**
```bash
cd /var/www/crm/backend
nano .env
```
(Paste your .env content - see GIT_DEPLOYMENT_GUIDE.md)

**Frontend `.env.production`:**
```bash
cd /var/www/crm/frontend
nano .env.production
```
(Paste: `NEXT_PUBLIC_STRAPI_URL=https://crm.winstonacademy.co.uk/api`)

---

### Step 5: Install, Build, and Start

```bash
# Backend
cd /var/www/crm/backend
npm install
npm run build

# Frontend
cd /var/www/crm/frontend
npm install
npm run build

# Create PM2 config
cd /var/www/crm
# (Copy ecosystem.config.js from GIT_DEPLOYMENT_GUIDE.md)

# Start with PM2
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🔄 Daily Deployment Workflow

### When you make changes:

1. **Local changes:**
   ```bash
   # Make your changes
   git add .
   git commit -m "Your change description"
   git push origin main
   ```

2. **Deploy to VPS:**
   ```bash
   ssh root@87.106.148.40
   cd /var/www/crm
   ./deploy.sh
   ```

---

## 📝 Create deploy.sh on VPS

```bash
cd /var/www/crm
nano deploy.sh
```

Paste:
```bash
#!/bin/bash
set -e

echo "🚀 Deploying..."

cd /var/www/crm/backend
git pull origin main
npm install --production
npm run build
pm2 restart crm-backend

cd /var/www/crm/frontend
git pull origin main
npm install --production
npm run build
pm2 restart crm-frontend

echo "✅ Done!"
pm2 status
```

Make executable:
```bash
chmod +x deploy.sh
```

---

## ✅ Verify

```bash
pm2 status
curl http://localhost:1337/api/users-permissions/auth/forgot-password
curl http://localhost:3000
```

Done! 🎉

