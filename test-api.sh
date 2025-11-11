#!/bin/bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:1337/api/auth/local \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@winston.edu","password":"Admin123!"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['jwt'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  exit 1
fi

echo "✅ Token obtained"

# Test Leads API
echo ""
echo "=== Testing Leads API ==="
LEADS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:1337/api/leads?pagination[pageSize]=2")
LEADS_COUNT=$(echo $LEADS_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null)

if [ "$LEADS_COUNT" -gt 0 ]; then
  echo "✅ Leads API working: $LEADS_COUNT leads found"
else
  echo "❌ Leads API issue"
  echo "$LEADS_RESPONSE" | head -20
fi

# Test Students API
echo ""
echo "=== Testing Students API ==="
STUDENTS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:1337/api/students?pagination[pageSize]=2")
STUDENTS_COUNT=$(echo $STUDENTS_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null)

if [ "$STUDENTS_COUNT" -gt 0 ]; then
  echo "✅ Students API working: $STUDENTS_COUNT students found"
else
  echo "❌ Students API issue"
  echo "$STUDENTS_RESPONSE" | head -20
fi

# Test Users API
echo ""
echo "=== Testing Users API ==="
USERS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:1337/api/users?pagination[pageSize]=2")
USERS_COUNT=$(echo $USERS_RESPONSE | python3 -c "import sys, json; print(len(sys.stdin.read()))" 2>/dev/null)

if [ "$USERS_COUNT" -gt 10 ]; then
  echo "✅ Users API working"
else
  echo "❌ Users API issue"  
  echo "$USERS_RESPONSE" | head -20
fi
