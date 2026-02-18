#!/bin/bash
set -e

echo "---- Fixing Backend Environment Variables ----"

# Define paths
ENV_SOURCE="/var/www/crm-winston/backend/.env"
STRAPI_ROOT="/var/www/crm-winston/backend/WinstonCRM-strapi/winston-crm"

# Check if source exists
if [ -f "$ENV_SOURCE" ]; then
    echo "Found .env at $ENV_SOURCE"
    
    # Copy to Strapi root
    cp "$ENV_SOURCE" "$STRAPI_ROOT/.env"
    echo "Copied .env to $STRAPI_ROOT/.env"
    
    # Verify it exists
    if [ -f "$STRAPI_ROOT/.env" ]; then
        echo "Verification successful."
    else
        echo "Error: Failed to copy .env file."
        exit 1
    fi
else
    echo "Error: Source .env not found at $ENV_SOURCE"
    exit 1
fi

echo "---- Restarting Strapi Backend ----"
pm2 restart strapi-backend

echo "---- Waiting for restart... ----"
sleep 5

echo "---- Checking Status ----"
pm2 list
pm2 logs strapi-backend --lines 20 --nostream

echo "---- Done ----"
