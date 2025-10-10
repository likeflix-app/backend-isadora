# File Upload API Documentation

## Overview

This backend implements a file upload system for storing talent media kits (photos, PDFs) using Render's file storage. Files are stored on disk and served statically.

## 📁 Directory Structure

```
backend-isadora/
├── server.js
├── package.json
├── uploads/
│   └── media-kits/
│       ├── talent-1234567890-123456789.jpg
│       ├── talent-1234567891-123456789.png
│       └── ...
└── .gitignore
```

## 🔧 Configuration

### File Upload Settings
- **Max File Size**: 10MB per file
- **Max Files per Request**: 10 files
- **Allowed Types**: JPEG, JPG, PNG, GIF, WebP, PDF
- **Storage Location**: `uploads/media-kits/`
- **Filename Format**: `talent-{timestamp}-{random}.{ext}`

### Environment Variables
```bash
PORT=3001
FRONTEND_URL=https://frontend-isadora.onrender.com
JWT_SECRET=your-secret-key
```

## 📡 API Endpoints

### 1. Upload Media Kit Files

**POST** `/api/upload/media-kit`

Upload one or multiple files for talent media kits.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with field name `mediaKit` (array)

**cURL Example:**
```bash
curl -X POST https://backend-isadora.onrender.com/api/upload/media-kit \
  -F "mediaKit=@photo1.jpg" \
  -F "mediaKit=@photo2.png" \
  -F "mediaKit=@document.pdf"
```

**JavaScript/Fetch Example:**
```javascript
const formData = new FormData();
formData.append('mediaKit', file1);
formData.append('mediaKit', file2);

const response = await fetch('https://backend-isadora.onrender.com/api/upload/media-kit', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Response (200 OK):**
```json
{
  "success": true,
  "files": [
    {
      "filename": "talent-1728567890123-987654321.jpg",
      "originalName": "photo1.jpg",
      "size": 245678,
      "url": "https://backend-isadora.onrender.com/uploads/media-kits/talent-1728567890123-987654321.jpg"
    },
    {
      "filename": "talent-1728567891234-876543210.png",
      "originalName": "photo2.png",
      "size": 189234,
      "url": "https://backend-isadora.onrender.com/uploads/media-kits/talent-1728567891234-876543210.png"
    }
  ],
  "urls": [
    "https://backend-isadora.onrender.com/uploads/media-kits/talent-1728567890123-987654321.jpg",
    "https://backend-isadora.onrender.com/uploads/media-kits/talent-1728567891234-876543210.png"
  ]
}
```

**Error Responses:**

*No Files Uploaded (400):*
```json
{
  "error": "No files uploaded"
}
```

*Invalid File Type (500):*
```json
{
  "error": "Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed"
}
```

*File Too Large (500):*
```json
{
  "error": "File too large"
}
```

---

### 2. Delete Media Kit File

**DELETE** `/api/upload/media-kit/:filename`

Delete a specific uploaded file.

**Request:**
- Method: `DELETE`
- URL Parameter: `filename` - The filename to delete

**cURL Example:**
```bash
curl -X DELETE https://backend-isadora.onrender.com/api/upload/media-kit/talent-1728567890123-987654321.jpg
```

**JavaScript/Fetch Example:**
```javascript
const filename = 'talent-1728567890123-987654321.jpg';
const response = await fetch(`https://backend-isadora.onrender.com/api/upload/media-kit/${filename}`, {
  method: 'DELETE'
});

const result = await response.json();
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Error Responses:**

*File Not Found (404):*
```json
{
  "error": "File not found"
}
```

---

### 3. List All Media Kit Files (Admin Only)

**GET** `/api/admin/media-kits`

Get a list of all uploaded media kit files. Requires admin authentication.

**Request:**
- Method: `GET`
- Headers: 
  - `Authorization: Bearer {admin_jwt_token}`

**cURL Example:**
```bash
curl -X GET https://backend-isadora.onrender.com/api/admin/media-kits \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**JavaScript/Fetch Example:**
```javascript
const response = await fetch('https://backend-isadora.onrender.com/api/admin/media-kits', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

const result = await response.json();
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "filename": "talent-1728567890123-987654321.jpg",
      "url": "https://backend-isadora.onrender.com/uploads/media-kits/talent-1728567890123-987654321.jpg",
      "size": 245678,
      "uploadedAt": "2025-10-10T10:30:00.000Z"
    },
    {
      "filename": "talent-1728567891234-876543210.png",
      "url": "https://backend-isadora.onrender.com/uploads/media-kits/talent-1728567891234-876543210.png",
      "size": 189234,
      "uploadedAt": "2025-10-10T10:31:00.000Z"
    }
  ],
  "count": 2
}
```

**Error Responses:**

*Unauthorized (401):*
```json
{
  "success": false,
  "message": "Access token required"
}
```

*Forbidden (403):*
```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

### 4. Serve Static Files

**GET** `/uploads/media-kits/:filename`

Access uploaded files directly via static URL.

**Example URLs:**
```
https://backend-isadora.onrender.com/uploads/media-kits/talent-1728567890123-987654321.jpg
https://backend-isadora.onrender.com/uploads/media-kits/talent-1728567891234-876543210.png
```

These URLs can be used directly in `<img>` tags or downloaded:

```html
<img src="https://backend-isadora.onrender.com/uploads/media-kits/talent-1728567890123-987654321.jpg" alt="Talent Photo">
```

---

## 🔐 Authentication

### Admin Authentication

To access admin-only endpoints, you need a valid JWT token with admin role.

**Login as Admin:**
```bash
curl -X POST https://backend-isadora.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@talento.com",
    "password": "password"
  }'
```

**Default Admin Credentials:**
- Email: `admin@talento.com`
- Password: `password`

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "2",
      "email": "admin@talento.com",
      "name": "Admin User",
      "role": "admin",
      "emailVerified": true
    }
  }
}
```

Use the `token` in the `Authorization` header for admin endpoints:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 Testing the API

### Upload Test
```bash
# Create a test image
echo "Test Image" > test.jpg

# Upload it
curl -X POST http://localhost:3001/api/upload/media-kit \
  -F "mediaKit=@test.jpg"
```

### List Files Test (Admin)
```bash
# First login as admin
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@talento.com","password":"password"}' \
  | jq -r '.data.token')

# List all files
curl -X GET http://localhost:3001/api/admin/media-kits \
  -H "Authorization: Bearer $TOKEN"
```

### Delete File Test
```bash
# Replace with actual filename
curl -X DELETE http://localhost:3001/api/upload/media-kit/talent-1728567890123-987654321.jpg
```

---

## 📦 Frontend Integration

### React Example with Multiple Files

```javascript
import React, { useState } from 'react';

function MediaKitUploader() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('mediaKit', file);
    });

    try {
      const response = await fetch('https://backend-isadora.onrender.com/api/upload/media-kit', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadedUrls(result.urls);
        console.log('Uploaded files:', result.files);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        accept="image/*,.pdf"
        onChange={handleFileChange}
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Files'}
      </button>
      
      {uploadedUrls.length > 0 && (
        <div>
          <h3>Uploaded Files:</h3>
          {uploadedUrls.map((url, index) => (
            <img key={index} src={url} alt={`Upload ${index}`} style={{ width: 200 }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default MediaKitUploader;
```

---

## 🚀 Deployment on Render

### Important Notes for Render

1. **Disk Storage**: Files are stored on Render's disk storage, which is ephemeral. Files will be lost when the service restarts.

2. **For Persistent Storage**: Consider upgrading to:
   - Render Persistent Disks
   - External storage services (AWS S3, Cloudinary, etc.)

3. **Environment Variables**: Set these in Render dashboard:
   - `PORT` (auto-set by Render)
   - `FRONTEND_URL`
   - `JWT_SECRET`

### Render Deploy Command
```bash
npm start
```

---

## 📊 Error Handling

All endpoints follow a consistent error format:

```json
{
  "error": "Error message here",
  "success": false
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing files, invalid input)
- `401` - Unauthorized (missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (file doesn't exist)
- `500` - Internal Server Error

---

## 🔒 Security Considerations

1. **File Type Validation**: Only allows images (JPEG, PNG, GIF, WebP) and PDFs
2. **File Size Limit**: 10MB per file to prevent abuse
3. **Admin-Only Operations**: File listing requires admin authentication
4. **No Path Traversal**: Filenames are sanitized and generated server-side
5. **CORS Protection**: Only allowed origins can upload files

---

## 📝 License

This API is part of the Talento Backend system.

