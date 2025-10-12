#!/bin/bash

# Add admin user via API
# Change the URL, email, password, and name as needed

API_URL="https://backend-isadora.onrender.com"  # Change this to your backend URL
# Or for local: API_URL="http://localhost:3001"

ADMIN_EMAIL="admin@isadora.com"
ADMIN_PASSWORD="Admin123!"
ADMIN_NAME="Isadora Admin"

echo "🔐 Creating admin user via API..."
echo "📧 Email: $ADMIN_EMAIL"
echo "🌐 API URL: $API_URL"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/auth/create-admin" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"name\": \"$ADMIN_NAME\"
  }")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ If successful, you can now login with:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: $ADMIN_PASSWORD"

