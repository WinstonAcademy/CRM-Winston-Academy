# Deployment Instructions for IONOS VPS

## Prerequisites
- SSH access to your IONOS VPS (IP: 87.106.148.40)
- Domain configured: crm.winstonacademy.co.uk → 87.106.148.40
- Node.js 18+ installed on VPS
- Nginx installed on VPS

## Step 1: SSH into VPS

```bash
ssh root@87.106.148.40
# or
ssh crmuser@87.106.148.40
```

## Step 2: Install Required Software

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18+ (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Nginx (if not installed)
apt install -y nginx

# Install PM2 globally
npm install -g pm2

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx
```

## Step 3: Create Directory Structure

```bash
# Create application directories
mkdir -p /var/www/crm
mkdir -p /var/www/crm/backend
mkdir -p /var/www/crm/frontend

# Set permissions
chown -R $USER:$USER /var/www/crm
```

## Step 4: Transfer Files to VPS

### Option A: Using Git (Recommended)

```bash
# On VPS
cd /var/www/crm
git clone YOUR_REPO_URL backend
git clone YOUR_REPO_URL frontend
cd backend
git checkout main  # or your branch
cd ../frontend
git checkout main  # or your branch
```

### Option B: Using SCP (from your local machine)

```bash
# From your local machine
cd /Users/nikitasomani/Downloads/Win

# Transfer backend
scp -r WinstonCRM-strapi/winston-crm/* root@87.106.148.40:/var/www/crm/backend/

# Transfer frontend
scp -r CRMWinston/* root@87.106.148.40:/var/www/crm/frontend/
```

## Step 5: Install Dependencies on VPS

```bash
# Backend
cd /var/www/crm/backend
npm install --production

# Frontend
cd /var/www/crm/frontend
npm install --production
```

## Step 6: Create Environment Files on VPS

### Backend .env file (`/var/www/crm/backend/.env`)

```env
# Server Configuration
HOST=0.0.0.0
PORT=1337

# Frontend URL
FRONTEND_URL=https://crm.winstonacademy.co.uk

# Email Configuration for Name.com
EMAIL_PROVIDER=smtp
SMTP_HOST=mail.name.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=info@winstonacademy.co.uk
SMTP_PASSWORD=Winston@2025
EMAIL_FROM=info@winstonacademy.co.uk
EMAIL_REPLY_TO=info@winstonacademy.co.uk

# Secrets (Copy from your local .env file)
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

### Frontend .env.production file (`/var/www/crm/frontend/.env.production`)

```env
NEXT_PUBLIC_STRAPI_URL=https://crm.winstonacademy.co.uk/api
NODE_ENV=production
```

## Step 7: Build Applications on VPS

```bash
# Backend
cd /var/www/crm/backend
npm run build

# Frontend
cd /var/www/crm/frontend
npm run build
```

## Step 8: Create PM2 Ecosystem File

Create `/var/www/crm/ecosystem.config.js`:

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

## Step 9: Create Log Directory

```bash
mkdir -p /var/www/crm/logs
```

## Step 10: Start Applications with PM2

```bash
cd /var/www/crm
pm2 start ecosystem.config.js
pm2 save
pm2 startup
# Follow the instructions to enable PM2 on system startup
```

## Step 11: Configure Nginx

Create `/etc/nginx/sites-available/crm.winstonacademy.co.uk`:

```nginx
server {
    listen 80;
    server_name crm.winstonacademy.co.uk;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name crm.winstonacademy.co.uk;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/crm.winstonacademy.co.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.winstonacademy.co.uk/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API (Strapi)
    location /api {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Strapi Admin Panel
    location /admin {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:1337;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Increase body size for file uploads
    client_max_body_size 100M;
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/crm.winstonacademy.co.uk /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Step 12: Set Up SSL Certificate

```bash
certbot --nginx -d crm.winstonacademy.co.uk
```

Follow the prompts to complete SSL setup.

## Step 13: Configure Firewall

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## Step 14: Verify Deployment

1. Check PM2 status:
   ```bash
   pm2 status
   pm2 logs
   ```

2. Test backend:
   ```bash
   curl https://crm.winstonacademy.co.uk/api/users-permissions/auth/forgot-password
   ```

3. Test frontend:
   - Visit: https://crm.winstonacademy.co.uk
   - Try logging in

## Troubleshooting

### Check PM2 Logs
```bash
pm2 logs crm-backend
pm2 logs crm-frontend
```

### Restart Applications
```bash
pm2 restart all
```

### Check Nginx Status
```bash
systemctl status nginx
nginx -t
```

### Check Ports
```bash
netstat -tulpn | grep -E "1337|3000"
```

## Important Notes

- Database file location: `/var/www/crm/backend/.tmp/data.db`
- Uploads location: `/var/www/crm/backend/public/uploads`
- Logs location: `/var/www/crm/logs/`
- PM2 will auto-restart apps on server reboot
- SSL certificates auto-renew with certbot





