#!/bin/bash
# ============================================
# Winston Academy CRM - Local Dev Launcher
# ============================================
# This script starts both the Strapi backend
# and the Next.js frontend in separate tabs.
# ============================================

echo "🚀 Starting Winston Academy CRM locally..."

# ---- BACKEND (Strapi on port 1337) ----
echo "📦 Starting Strapi backend on http://localhost:1337 ..."
osascript -e 'tell application "Terminal"
  activate
  set backendWindow to do script "cd /Users/nikitasomani/Downloads/Win/WinstonCRM-strapi/winston-crm && npm run dev"
end tell'

sleep 2

# ---- FRONTEND (Next.js on port 3000) ----
echo "🌐 Starting Next.js frontend on http://localhost:3000 ..."
osascript -e 'tell application "Terminal"
  activate
  tell application "System Events" to keystroke "t" using command down
  delay 1
  do script "cd /Users/nikitasomani/Downloads/Win/CRMWinston && npm run dev" in front window
end tell'

echo ""
echo "✅ Both servers launching!"
echo "   Backend  → http://localhost:1337"
echo "   Frontend → http://localhost:3000"
echo "   Strapi Admin → http://localhost:1337/admin"
echo ""
echo "⏳ The backend (Strapi) may take 30-60s to fully start."
