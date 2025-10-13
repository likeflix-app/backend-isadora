#!/bin/bash

# Test script to verify the upload endpoint returns proper URLs
echo "🧪 Testing Cloudinary upload endpoint..."

# Create a test image file (1x1 pixel PNG)
echo "📸 Creating test image..."
cat > test-image.png << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

# Decode base64 to actual PNG file
base64 -d test-image.png > test-image-actual.png

# Test the upload endpoint
echo "📤 Testing upload endpoint..."
curl -X POST \
  -F "mediaKit=@test-image-actual.png" \
  -F "userId=test-user-123" \
  http://localhost:3001/api/upload/media-kit \
  -H "Content-Type: multipart/form-data" \
  | jq '.'

# Cleanup
rm -f test-image.png test-image-actual.png

echo "✅ Test completed!"
