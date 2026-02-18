#!/bin/bash
set -e

DOMAIN="crm.winstonacademy.co.uk"
# Use localhost IPs for proxy passes
FRONTEND_URL="http://127.0.0.1:3000"
BACKEND_URL="http://127.0.0.1:1337"

echo "---- Configuring Nginx for $DOMAIN ----"

cat > /etc/nginx/sites-available/crm-winston <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend - Next.js
    location / {
        proxy_pass $FRONTEND_URL;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Frontend - Auth API (Prevent /api capture by backend)
    location /api/auth {
        proxy_pass $FRONTEND_URL/api/auth;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend - Strapi API
    location /api {
        proxy_pass $BACKEND_URL/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend - Strapi Admin
    location /admin {
        proxy_pass $BACKEND_URL/admin;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend - Strapi Documentation/Assets
    location /uploads {
        proxy_pass $BACKEND_URL/uploads;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
    
    location /content-manager {
         proxy_pass $BACKEND_URL/content-manager;
         proxy_http_version 1.1;
         proxy_set_header Host \$host;
    }
    
    location /content-type-builder {
         proxy_pass $BACKEND_URL/content-type-builder;
         proxy_http_version 1.1;
         proxy_set_header Host \$host;
    }
    
    location /upload {
         proxy_pass $BACKEND_URL/upload;
         proxy_http_version 1.1;
         proxy_set_header Host \$host;
    }
    
    location /users-permissions {
         proxy_pass $BACKEND_URL/users-permissions;
         proxy_http_version 1.1;
         proxy_set_header Host \$host;
    }
    
    location /i18n {
         proxy_pass $BACKEND_URL/i18n;
         proxy_http_version 1.1;
         proxy_set_header Host \$host;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/crm-winston /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx

echo "---- Nginx Configured ----"
echo "Note: SSL setup (Certbot) will be run commands manually now if DNS is propagated."
