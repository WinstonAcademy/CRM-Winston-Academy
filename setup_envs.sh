#!/bin/bash
set -e

# Backend .env content
BACKEND_ENV="HOST=0.0.0.0
PORT=1337
APP_KEYS=W0Sgpe2B2AnB3KE5E5sidA==,1PP29CRdUvd3pdvaNSS1eQ==,/vhlXwBk2LL+vGqKYXDlwA==,1EM7s53VHePI/GrXHOOsRQ==
API_TOKEN_SALT=G3DXK06FKg0KrWYlvY8/oA==
ADMIN_JWT_SECRET=miZxhHkYTGCYg/bCrB63Cg==
TRANSFER_TOKEN_SALT=k6WqRwcTtuvV0A1rTHpMgQ==
# Database
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
JWT_SECRET=+9mjBaJRF/htb9Lm4Fppaw==
# Email
email_provider=smtp
email_settings_host=mail.name.com
email_settings_port=465
email_settings_secure=true
email_settings_auth_user=mail.winstonacademy.co.uk
email_settings_auth_pass=Winston@2025
email_settings_default_from=info@winstonacademy.co.uk
email_settings_default_replyto=info@winstonacademy.co.uk
# URLs
PUBLIC_URL=http://87.106.148.40:1337
"

# Frontend .env content
# Pointing to the Nginx Proxy (Port 80) instead of direct Strapi Port (1337)
# This fixes "Connection Refused" when Next.js tries to talk to Strapi serverside
FRONTEND_ENV="NEXT_PUBLIC_STRAPI_URL=http://87.106.148.40/api
"

echo "---- Setting up Environment Variables ----"

# Ensure directories exist (just in case)
mkdir -p /var/www/crm-winston/backend
mkdir -p /var/www/crm-winston/frontend

# Write Backend .env
echo "$BACKEND_ENV" > /var/www/crm-winston/backend/.env
echo "Backend .env created."

# Write Frontend .env
echo "$FRONTEND_ENV" > /var/www/crm-winston/frontend/.env.local
echo "Frontend .env.local created."

echo "---- Environment Setup Complete ----"
