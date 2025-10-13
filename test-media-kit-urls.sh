#!/bin/bash

# Test script to verify mediaKitUrls are properly saved to database
echo "🧪 Testing talent application with mediaKitUrls..."

# Test data with mediaKitUrls
curl -X POST https://backend-isadora.onrender.com/api/talent/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "fullName": "Test User",
    "birthYear": 1995,
    "city": "Test City",
    "phone": "1234567890",
    "termsAccepted": true,
    "mediaKitUrls": [
      "https://res.cloudinary.com/djecxub3z/image/upload/v1234567890/test1.jpg",
      "https://res.cloudinary.com/djecxub3z/image/upload/v1234567890/test2.jpg"
    ],
    "socialChannels": ["Instagram"],
    "contentCategories": ["Tech"]
  }' \
  | jq '.'

echo "✅ Test completed! Check the backend logs for mediaKitUrls processing."
