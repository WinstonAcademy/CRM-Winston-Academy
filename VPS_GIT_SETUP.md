# VPS Git Setup Guide

## Issue: GitHub Authentication

GitHub no longer accepts passwords. You need a **Personal Access Token (PAT)**.

## Option 1: Use Personal Access Token (Easier)

### Step 1: Create Personal Access Token on GitHub

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name it: `VPS Deployment`
4. Select scopes: Check **`repo`** (full control of private repositories)
5. Click **"Generate token"**
6. **COPY THE TOKEN** (you won't see it again!)

### Step 2: Clone on VPS using Token

On your VPS, run:

```bash
cd /var/www/crm

# Clone using token (replace YOUR_TOKEN with your actual token)
git clone https://YOUR_TOKEN@github.com/niksom406/CRM-Winston-Academy.git temp-repo

# Copy backend files (preserving your .env file)
cp -r temp-repo/WinstonCRM-strapi/winston-crm/* backend/

# Copy frontend files (preserving your .env.production file)
cp -r temp-repo/CRMWinston/* frontend/

# Clean up temp repository
rm -rf temp-repo

# Set up Git remotes for future pulls
cd backend
git init
git remote add origin https://YOUR_TOKEN@github.com/niksom406/CRM-Winston-Academy.git
git fetch origin
git checkout -b main origin/main

cd ../frontend
git init
git remote add origin https://YOUR_TOKEN@github.com/niksom406/CRM-Winston-Academy.git
git fetch origin
git checkout -b main origin/main

cd /var/www/crm
```

**⚠️ Security Note:** The token will be visible in `.git/config`. For better security, use Option 2 (SSH) or Git Credential Helper.

---

## Option 2: Use SSH (More Secure)

### Step 1: Generate SSH Key on VPS

```bash
# On VPS
ssh-keygen -t ed25519 -C "vps-deployment"
# Press Enter to accept default location
# Press Enter twice for no passphrase (or set one)
```

### Step 2: Copy Public Key

```bash
cat ~/.ssh/id_ed25519.pub
# Copy the output
```

### Step 3: Add SSH Key to GitHub

1. Go to: https://github.com/settings/keys
2. Click **"New SSH key"**
3. Title: `VPS Deployment`
4. Paste the public key
5. Click **"Add SSH key"**

### Step 4: Clone using SSH

```bash
cd /var/www/crm

# Clone using SSH
git clone git@github.com:niksom406/CRM-Winston-Academy.git temp-repo

# Copy backend files
cp -r temp-repo/WinstonCRM-strapi/winston-crm/* backend/

# Copy frontend files
cp -r temp-repo/CRMWinston/* frontend/

# Clean up
rm -rf temp-repo

# Set up Git remotes
cd backend
git init
git remote add origin git@github.com:niksom406/CRM-Winston-Academy.git
git fetch origin
git checkout -b main origin/main

cd ../frontend
git init
git remote add origin git@github.com:niksom406/CRM-Winston-Academy.git
git fetch origin
git checkout -b main origin/main

cd /var/www/crm
```

---

## Option 3: Use Git Credential Helper (Token stored securely)

### Step 1: Create Personal Access Token (same as Option 1, Step 1)

### Step 2: Configure Git Credential Helper

```bash
# On VPS
git config --global credential.helper store

# Clone (will prompt for username and password)
git clone https://github.com/niksom406/CRM-Winston-Academy.git temp-repo
# Username: niksom406
# Password: YOUR_TOKEN (paste the token, not your GitHub password)
```

The credentials will be saved in `~/.git-credentials` for future use.

---

## Recommended: Quick Setup Script

After choosing an option above, run this script:

```bash
cd /var/www/crm

# Install dependencies
cd backend
npm install
cd ../frontend
npm install

# Build applications
cd ../backend
npm run build
cd ../frontend
npm run build

# Create PM2 ecosystem file
cd /var/www/crm
cat > ecosystem.config.js << 'EOF'
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
EOF

# Create logs directory
mkdir -p /var/www/crm/logs

# Start PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Future Updates (Deploy Script)

Create `/var/www/crm/deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying..."

cd /var/www/crm/backend
git pull origin main
npm install
npm run build
pm2 restart crm-backend

cd /var/www/crm/frontend
git pull origin main
npm install
npm run build
pm2 restart crm-frontend

echo "✅ Done!"
pm2 status
```

Make it executable:
```bash
chmod +x /var/www/crm/deploy.sh
```

Then for future updates, just run:
```bash
/var/www/crm/deploy.sh
```

