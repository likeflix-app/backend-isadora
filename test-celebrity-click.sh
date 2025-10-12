#!/bin/bash

# Test script for Celebrity Status & Click Tracking API
# Make sure the server is running before executing this script

BASE_URL="http://localhost:3001"
# Replace with your admin token after logging in
ADMIN_TOKEN="your-admin-token-here"
# Replace with an actual talent ID from your database
TALENT_ID="your-talent-id-here"

echo "🧪 Testing Celebrity Status & Click Tracking API"
echo "================================================"
echo ""

# Test 1: Get all talents (should show isCelebrity and clickCount fields)
echo "1️⃣ Testing GET /api/talents (should include isCelebrity and clickCount)"
echo "-------------------------------------------------------------------"
curl -X GET "$BASE_URL/api/talents" \
  -H "Content-Type: application/json" \
  | jq '.'
echo ""
echo ""

# Test 2: Toggle celebrity status to true (requires admin token)
echo "2️⃣ Testing PATCH /api/talents/:talentId/celebrity-status (set to true)"
echo "----------------------------------------------------------------------"
curl -X PATCH "$BASE_URL/api/talents/$TALENT_ID/celebrity-status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"isCelebrity": true}' \
  | jq '.'
echo ""
echo ""

# Test 3: Track a click
echo "3️⃣ Testing POST /api/talents/:talentId/track-click"
echo "--------------------------------------------------"
curl -X POST "$BASE_URL/api/talents/$TALENT_ID/track-click" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "userAgent": "Mozilla/5.0 (Test Script)",
    "ipAddress": "127.0.0.1"
  }' \
  | jq '.'
echo ""
echo ""

# Test 4: Track another click
echo "4️⃣ Testing POST /api/talents/:talentId/track-click (second click)"
echo "----------------------------------------------------------------"
curl -X POST "$BASE_URL/api/talents/$TALENT_ID/track-click" \
  -H "Content-Type: application/json" \
  -d '{"timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' \
  | jq '.'
echo ""
echo ""

# Test 5: Get talents again to verify changes
echo "5️⃣ Testing GET /api/talents (verify celebrity status and click count)"
echo "---------------------------------------------------------------------"
curl -X GET "$BASE_URL/api/talents" \
  -H "Content-Type: application/json" \
  | jq '.data[] | select(.id == "'$TALENT_ID'") | {id, fullName, isCelebrity, clickCount}'
echo ""
echo ""

# Test 6: Toggle celebrity status to false
echo "6️⃣ Testing PATCH /api/talents/:talentId/celebrity-status (set to false)"
echo "-----------------------------------------------------------------------"
curl -X PATCH "$BASE_URL/api/talents/$TALENT_ID/celebrity-status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"isCelebrity": false}' \
  | jq '.'
echo ""
echo ""

echo "✅ All tests completed!"
echo ""
echo "📝 Instructions:"
echo "1. Replace ADMIN_TOKEN with your actual admin JWT token"
echo "2. Replace TALENT_ID with an actual talent ID from your database"
echo "3. Make sure the server is running on port 3001"
echo "4. Run this script: bash test-celebrity-click.sh"

