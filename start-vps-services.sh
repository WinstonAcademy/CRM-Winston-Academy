#!/bin/bash

# Script to start Frontend and Backend on VPS
# Run this on your VPS: ssh root@87.106.148.40

echo "=========================================="
echo "Starting Winston Academy CRM Services"
echo "=========================================="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing..."
    npm install -g pm2
fi

# Check if directories exist
if [ ! -d "/var/www/crm/backend" ]; then
    echo "ERROR: Backend directory not found at /var/www/crm/backend"
    echo "Please deploy files first."
    exit 1
fi

if [ ! -d "/var/www/crm/frontend" ]; then
    echo "ERROR: Frontend directory not found at /var/www/crm/frontend"
    echo "Please deploy files first."
    exit 1
fi

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
    echo "✓ Created ecosystem.config.js"
fi

# Create logs directory
mkdir -p /var/www/crm/logs

# Stop existing processes if running
echo "Stopping existing processes..."
pm2 stop crm-backend crm-frontend 2>/dev/null || true
pm2 delete crm-backend crm-frontend 2>/dev/null || true

# Check if backend is built
if [ ! -d "/var/www/crm/backend/dist" ] && [ ! -d "/var/www/crm/backend/build" ]; then
    echo ""
    echo "Backend not built. Building now..."
    cd /var/www/crm/backend
    npm run build
    if [ $? -ne 0 ]; then
        echo "ERROR: Backend build failed. Check logs above."
        exit 1
    fi
    echo "✓ Backend built successfully"
fi

# Check if frontend is built
if [ ! -d "/var/www/crm/frontend/.next" ]; then
    echo ""
    echo "Frontend not built. Building now..."
    cd /var/www/crm/frontend
    npm run build
    if [ $? -ne 0 ]; then
        echo "ERROR: Frontend build failed. Check logs above."
        exit 1
    fi
    echo "✓ Frontend built successfully"
fi

# Start services with PM2
echo ""
echo "Starting services with PM2..."
cd /var/www/crm
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Show status
echo ""
echo "=========================================="
echo "Service Status:"
echo "=========================================="
pm2 status

echo ""
echo "=========================================="
echo "Services Started!"
echo "=========================================="
echo ""
echo "Backend: http://localhost:1337"
echo "Frontend: http://localhost:3000"
echo ""
echo "View logs:"
echo "  pm2 logs crm-backend"
echo "  pm2 logs crm-frontend"
echo ""
echo "Restart services:"
echo "  pm2 restart all"
echo ""
echo "Stop services:"
echo "  pm2 stop all"
echo ""

# Check if services are listening
sleep 3
echo "Checking if services are listening..."
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


