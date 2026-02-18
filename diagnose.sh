#!/bin/bash
echo "============================================"
echo "           DIAGNOSTIC REPORT                "
echo "============================================"

echo ""
echo "---- 1. System Memory ----"
free -h

echo ""
echo "---- 2. Disk Usage ----"
df -h

echo ""
echo "---- 3. PM2 Process List ----"
pm2 list

echo ""
echo "---- 4. Strapi Backend Logs (Last 100 lines) ----"
pm2 logs strapi-backend --lines 100 --nostream

echo ""
echo "---- 5. Next.js Frontend Logs (Last 50 lines) ----"
pm2 logs nextjs-frontend --lines 50 --nostream

echo ""
echo "---- 6. Listening Ports ----"
netstat -tlpn || ss -tlpn

echo "============================================"
