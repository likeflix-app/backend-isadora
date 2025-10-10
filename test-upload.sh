#!/bin/bash

# File Upload API Test Script
# This script tests the media kit upload endpoints

BASE_URL="http://localhost:3001"

echo "🧪 Testing Talento Backend File Upload API"
echo "=========================================="
echo ""

# Create a test file
echo "Creating test file..."
echo "This is a test file for media kit upload" > test-file.txt

# Test 1: Upload a file
echo "📤 Test 1: Uploading test file..."
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/upload/media-kit" \
  -F "mediaKit=@test-file.txt")

echo "Response: $UPLOAD_RESPONSE"
echo ""

# Extract filename from response (requires jq)
if command -v jq &> /dev/null; then
  FILENAME=$(echo $UPLOAD_RESPONSE | jq -r '.files[0].filename // empty')
  if [ ! -z "$FILENAME" ]; then
    echo "✅ File uploaded successfully: $FILENAME"
    echo ""
    
    # Test 2: Access the uploaded file
    echo "📥 Test 2: Accessing uploaded file..."
    ACCESS_RESPONSE=$(curl -s -w "\nHTTP Status: %{http_code}" "$BASE_URL/uploads/media-kits/$FILENAME")
    echo "$ACCESS_RESPONSE"
    echo ""
    
    # Test 3: Get admin token
    echo "🔐 Test 3: Getting admin token..."
    TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@talento.com","password":"password"}')
    
    TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.token // empty')
    
    if [ ! -z "$TOKEN" ]; then
      echo "✅ Admin token obtained"
      echo ""
      
      # Test 4: List all files (admin)
      echo "📂 Test 4: Listing all media kit files (admin)..."
      LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/api/admin/media-kits" \
        -H "Authorization: Bearer $TOKEN")
      echo "Response: $LIST_RESPONSE"
      echo ""
      
      # Test 5: Delete the file
      echo "🗑️ Test 5: Deleting uploaded file..."
      DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/upload/media-kit/$FILENAME")
      echo "Response: $DELETE_RESPONSE"
      echo ""
    else
      echo "❌ Failed to get admin token"
    fi
  else
    echo "❌ Upload failed or no filename in response"
  fi
else
  echo "⚠️ jq not installed. Install with: brew install jq"
fi

# Cleanup
rm -f test-file.txt

echo "=========================================="
echo "✅ Testing complete!"

