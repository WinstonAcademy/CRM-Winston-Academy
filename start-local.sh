#!/bin/bash

# Script to start both backend and frontend locally

echo "Starting Backend (Strapi) on http://localhost:1337..."
cd "$(dirname "$0")/WinstonCRM-strapi/winston-crm"
npm run develop &
BACKEND_PID=$!

echo "Waiting 5 seconds for backend to start..."
sleep 5

echo "Starting Frontend (Next.js) on http://localhost:3000..."
cd "$(dirname "$0")/CRMWinston"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "Services started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Backend: http://localhost:1337/admin"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"
echo "=========================================="

# Wait for user interrupt
wait


