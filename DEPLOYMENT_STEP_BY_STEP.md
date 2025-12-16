# Step-by-Step Deployment Guide

## Step 1: Connect to Your VPS

Open your terminal and SSH into your VPS:

```bash
ssh root@87.106.148.40
```

**If you get a password prompt:** Enter your VPS root password.

**If SSH key is not set up:** You may need to enter your password each time, or set up SSH keys.

Once connected, you should see a command prompt like:
```
root@your-vps:~#
```

---

## Step 2: Check What's Already Installed

Run these commands to check what's already on your VPS:

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check if Nginx is installed
nginx -v

# Check if PM2 is installed
pm2 --version

# Check system info
uname -a
```

**Tell me what versions you see**, and I'll guide you on what needs to be installed.

---

## Step 3: Install Required Software

Based on what's missing, we'll install:

### Install Node.js 18+ (if needed)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt update
apt install -y nodejs
```

### Install Nginx (if needed)
```bash
apt update
apt install -y nginx
```

### Install PM2 (if needed)
```bash
npm install -g pm2
```

### Install Certbot for SSL (if needed)
```bash
apt install -y certbot python3-certbot-nginx
```

---

## Step 4: Create Directory Structure

```bash
# Create directories
mkdir -p /var/www/crm/backend
mkdir -p /var/www/crm/frontend
mkdir -p /var/www/crm/logs

# Set permissions
chown -R $USER:$USER /var/www/crm
```

---

## Step 5: Transfer Files to VPS

We'll transfer your built applications. Choose one method:

### Method A: Using SCP (from your Mac)

**Open a NEW terminal window on your Mac** (keep the SSH session open in another window), then run:

```bash
cd /Users/nikitasomani/Downloads/Win

# Transfer backend
scp -r WinstonCRM-strapi/winston-crm/* root@87.106.148.40:/var/www/crm/backend/

# Transfer frontend  
scp -r CRMWinston/* root@87.106.148.40:/var/www/crm/frontend/
```

### Method B: Using Git (if your repo is on GitHub/GitLab)

On the VPS:
```bash
cd /var/www/crm
git clone YOUR_REPO_URL backend
git clone YOUR_REPO_URL frontend
```

---

## Step 6: Install Dependencies on VPS

Back in your SSH session on the VPS:

```bash
# Backend dependencies
cd /var/www/crm/backend
npm install --production

# Frontend dependencies
cd /var/www/crm/frontend
npm install --production
```

---

## Step 7: Create Environment Files

### Backend .env file

```bash
nano /var/www/crm/backend/.env
```

Paste this content (update with your actual values):

```env
HOST=0.0.0.0
PORT=1337
FRONTEND_URL=https://crm.winstonacademy.co.uk

# Email Configuration
EMAIL_PROVIDER=smtp
SMTP_HOST=mail.name.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=info@winstonacademy.co.uk
SMTP_PASSWORD=Winston@2025
EMAIL_FROM=info@winstonacademy.co.uk
EMAIL_REPLY_TO=info@winstonacademy.co.uk

# Secrets (Copy these from your local .env file)
APP_KEYS=W0Sgpe2B2AnB3KE5E5sidA==,1PP29CRdUvd3pdvaNSS1eQ==,/vhlXwBk2LL+vGqKYXDlwA==,1EM7s53VHePI/GrXHOOsRQ==
API_TOKEN_SALT=G3DXK06FKg0KrWYlvY8/oA==
ADMIN_JWT_SECRET=miZxhHkYTGCYg/bCrB63Cg==
TRANSFER_TOKEN_SALT=k6WqRwcTtuvV0A1rTHpMgQ==
ENCRYPTION_KEY=xhdvT+XIEuRwcL27UWqb0w==
JWT_SECRET=+9mjBaJRF/htb9Lm4Fppaw==

# Database
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### Frontend .env.production file

```bash
nano /var/www/crm/frontend/.env.production
```

Paste this:

```env
NEXT_PUBLIC_STRAPI_URL=https://crm.winstonacademy.co.uk/api
NODE_ENV=production
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

---

## Step 8: Build Applications on VPS

```bash
# Build backend
cd /var/www/crm/backend
npm run build

# Build frontend
cd /var/www/crm/frontend
npm run build
```

---

## Step 9: Create PM2 Configuration

```bash
nano /var/www/crm/ecosystem.config.js
```

Paste this:

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

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

---

## Step 10: Start Applications with PM2

```bash
cd /var/www/crm
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Important:** When you run `pm2 startup`, it will show a command. **Copy and run that command** to enable PM2 on system startup.

---

## Step 11: Configure Nginx

```bash
nano /etc/nginx/sites-available/crm.winstonacademy.co.uk
```

Paste the full Nginx configuration (see next section), then:

```bash
# Enable the site
ln -s /etc/nginx/sites-available/crm.winstonacademy.co.uk /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## Step 12: Set Up SSL Certificate

```bash
certbot --nginx -d crm.winstonacademy.co.uk
```

Follow the prompts:
- Enter your email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

---

## Step 13: Configure Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## Step 14: Test Your Deployment

1. Visit: https://crm.winstonacademy.co.uk
2. Try logging in with admin credentials
3. Check PM2 status: `pm2 status`
4. Check logs: `pm2 logs`

---

## Troubleshooting Commands

```bash
# Check PM2 status
pm2 status
pm2 logs

# Restart applications
pm2 restart all

# Check Nginx
systemctl status nginx
nginx -t

# Check if ports are listening
netstat -tulpn | grep -E "1337|3000"

# Check application logs
tail -f /var/www/crm/logs/backend-error.log
tail -f /var/www/crm/logs/frontend-error.log
```

