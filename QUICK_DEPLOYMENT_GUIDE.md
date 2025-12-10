# Quick Deployment Guide - Winston Academy CRM

## ✅ Pre-Deployment Checklist

- [x] Code prepared with environment variables
- [x] Backend built successfully
- [x] Frontend built successfully
- [x] DNS configured (crm.winstonacademy.co.uk → 87.106.148.40)
- [ ] VPS setup completed
- [ ] Applications deployed
- [ ] SSL configured

## 🚀 Quick Start Deployment

### 1. SSH into VPS
```bash
ssh root@87.106.148.40
```

### 2. Install Required Software
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs nginx

# PM2
npm install -g pm2

# Certbot for SSL
apt install -y certbot python3-certbot-nginx
```

### 3. Create Directories
```bash
mkdir -p /var/www/crm/{backend,frontend,logs}
```

### 4. Transfer Files

**Option A: Using Git (Recommended)**
```bash
cd /var/www/crm
git clone YOUR_REPO_URL backend
git clone YOUR_REPO_URL frontend
```

**Option B: Using SCP (from local machine)**
```bash
# From your Mac
cd /Users/nikitasomani/Downloads/Win
scp -r WinstonCRM-strapi/winston-crm/* root@87.106.148.40:/var/www/crm/backend/
scp -r CRMWinston/* root@87.106.148.40:/var/www/crm/frontend/
```

### 5. Install Dependencies
```bash
cd /var/www/crm/backend && npm install --production
cd /var/www/crm/frontend && npm install --production
```

### 6. Create Environment Files

**Backend** (`/var/www/crm/backend/.env`):
```env
HOST=0.0.0.0
PORT=1337
FRONTEND_URL=https://crm.winstonacademy.co.uk
SMTP_HOST=mail.name.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=info@winstonacademy.co.uk
SMTP_PASSWORD=Winston@2025
EMAIL_FROM=info@winstonacademy.co.uk
EMAIL_REPLY_TO=info@winstonacademy.co.uk
# Copy APP_KEYS, JWT_SECRET, etc. from your local .env
```

**Frontend** (`/var/www/crm/frontend/.env.production`):
```env
NEXT_PUBLIC_STRAPI_URL=https://crm.winstonacademy.co.uk/api
NODE_ENV=production
```

### 7. Build Applications
```bash
cd /var/www/crm/backend && npm run build
cd /var/www/crm/frontend && npm run build
```

### 8. Create PM2 Config

Create `/var/www/crm/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'crm-backend',
      cwd: '/var/www/crm/backend',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 1337 }
    },
    {
      name: 'crm-frontend',
      cwd: '/var/www/crm/frontend',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 3000 }
    }
  ]
};
```

### 9. Start with PM2
```bash
cd /var/www/crm
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 10. Configure Nginx

See `DEPLOYMENT_INSTRUCTIONS.md` for full Nginx configuration.

### 11. Set Up SSL
```bash
certbot --nginx -d crm.winstonacademy.co.uk
```

### 12. Test
Visit: https://crm.winstonacademy.co.uk

## 📋 Important Files

- Full instructions: `DEPLOYMENT_INSTRUCTIONS.md`
- Environment template: `WinstonCRM-strapi/winston-crm/.env.production.example`
- PM2 config: See Step 8 above
- Nginx config: See `DEPLOYMENT_INSTRUCTIONS.md`

## 🔧 Troubleshooting

**Check PM2:**
```bash
pm2 status
pm2 logs
```

**Check Nginx:**
```bash
systemctl status nginx
nginx -t
```

**Restart services:**
```bash
pm2 restart all
systemctl restart nginx
```

