#!/bin/bash

# Start Backend and Frontend Services

echo "=========================================="
echo "Starting Winston Academy CRM Services"
echo "=========================================="
echo ""

# Kill any existing processes on these ports
echo "Checking for existing processes..."
lsof -ti:1337 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# Start Backend
echo "Starting Backend (Strapi) on http://localhost:1337..."
cd "$(dirname "$0")/WinstonCRM-strapi/winston-crm"
npm run develop > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"
echo "Logs: tail -f /tmp/backend.log"

# Wait for backend to initialize
echo "Waiting 10 seconds for backend to initialize..."
sleep 10

# Start Frontend
echo ""
echo "Starting Frontend (Next.js) on http://localhost:3000..."
cd "$(dirname "$0")/CRMWinston"
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"
echo "Logs: tail -f /tmp/frontend.log"

echo ""
echo "=========================================="
echo "Services Status:"
echo "=========================================="
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Backend: http://localhost:1337/admin"
echo "Frontend: http://localhost:3000"
echo ""
echo "To view logs:"
echo "  Backend:  tail -f /tmp/backend.log"
echo "  Frontend: tail -f /tmp/frontend.log"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "=========================================="

# Check if services are running
sleep 5
echo ""
echo "Checking service status..."
if lsof -ti:1337 > /dev/null 2>&1; then
    echo "✓ Backend is running on port 1337"
else
    echo "✗ Backend failed to start. Check logs: tail -f /tmp/backend.log"
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo "✓ Frontend is running on port 3000"
else
    echo "✗ Frontend failed to start. Check logs: tail -f /tmp/frontend.log"
fi


