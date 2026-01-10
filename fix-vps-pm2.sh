#!/bin/bash

# Script to fix PM2 duplicate processes and restart cleanly
# Run this on your VPS

echo "=========================================="
echo "Cleaning up PM2 processes"
echo "=========================================="
echo ""

# Stop all processes
echo "Stopping all PM2 processes..."
pm2 stop all

# Delete all processes
echo "Deleting all PM2 processes..."
pm2 delete all

# Kill any remaining node processes on ports 1337 and 3000
echo "Killing any remaining processes on ports 1337 and 3000..."
lsof -ti:1337 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

sleep 2

echo ""
echo "=========================================="
echo "Checking for ecosystem.config.js"
echo "=========================================="

# Check if ecosystem.config.js exists
if [ ! -f "/var/www/crm/ecosystem.config.js" ]; then
    echo "Creating ecosystem.config.js..."
    cat > /var/www/crm/ecosystem.config.js << 'EOF'
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
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      instances: 1,
      exec_mode: 'fork'
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
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      instances: 1,
      exec_mode: 'fork'
    }
  ]
};
EOF
    echo "✓ Created ecosystem.config.js"
else
    echo "✓ ecosystem.config.js exists"
fi

# Create logs directory
mkdir -p /var/www/crm/logs

echo ""
echo "=========================================="
echo "Checking application status"
echo "=========================================="

# Check if backend directory exists and has package.json
if [ ! -f "/var/www/crm/backend/package.json" ]; then
    echo "ERROR: Backend package.json not found!"
    echo "Please ensure files are deployed to /var/www/crm/backend"
    exit 1
fi

# Check if frontend directory exists and has package.json
if [ ! -f "/var/www/crm/frontend/package.json" ]; then
    echo "ERROR: Frontend package.json not found!"
    echo "Please ensure files are deployed to /var/www/crm/frontend"
    exit 1
fi

# Check if .env files exist
if [ ! -f "/var/www/crm/backend/.env" ]; then
    echo "WARNING: Backend .env file not found!"
    echo "Backend may not start correctly without .env file"
fi

if [ ! -f "/var/www/crm/frontend/.env.production" ]; then
    echo "WARNING: Frontend .env.production file not found!"
    echo "Frontend may not start correctly without .env.production file"
fi

echo ""
echo "=========================================="
echo "Starting services with PM2"
echo "=========================================="

cd /var/www/crm
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

echo ""
echo "=========================================="
echo "Waiting 5 seconds for services to start..."
echo "=========================================="
sleep 5

echo ""
echo "=========================================="
echo "PM2 Status:"
echo "=========================================="
pm2 status

echo ""
echo "=========================================="
echo "Checking logs for errors..."
echo "=========================================="

# Check backend logs
echo ""
echo "--- Backend Logs (last 10 lines) ---"
pm2 logs crm-backend --lines 10 --nostream 2>/dev/null || echo "No backend logs yet"

# Check frontend logs
echo ""
echo "--- Frontend Logs (last 10 lines) ---"
pm2 logs crm-frontend --lines 10 --nostream 2>/dev/null || echo "No frontend logs yet"

echo ""
echo "=========================================="
echo "Checking if ports are listening..."
echo "=========================================="

if netstat -tuln 2>/dev/null | grep -q ":1337"; then
    echo "✓ Backend is listening on port 1337"
else
    echo "✗ Backend is NOT listening on port 1337"
    echo "  Check logs: pm2 logs crm-backend"
fi

if netstat -tuln 2>/dev/null | grep -q ":3000"; then
    echo "✓ Frontend is listening on port 3000"
else
    echo "✗ Frontend is NOT listening on port 3000"
    echo "  Check logs: pm2 logs crm-frontend"
fi

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
echo ""
echo "To view logs:"
echo "  pm2 logs crm-backend"
echo "  pm2 logs crm-frontend"
echo ""
echo "To restart:"
echo "  pm2 restart all"
echo ""


