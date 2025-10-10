# File Upload API - Quick Reference

## 🚀 Quick Start

### Start Server
```bash
npm start
```

---

## 📡 Endpoints Cheat Sheet

### 1️⃣ Upload Files
```bash
POST /api/upload/media-kit
```

**cURL:**
```bash
curl -X POST http://localhost:3001/api/upload/media-kit \
  -F "mediaKit=@photo.jpg" \
  -F "mediaKit=@document.pdf"
```

**JavaScript:**
```javascript
const formData = new FormData();
formData.append('mediaKit', file);

fetch('https://backend-isadora.onrender.com/api/upload/media-kit', {
  method: 'POST',
  body: formData
}).then(res => res.json());
```

---

### 2️⃣ Delete File
```bash
DELETE /api/upload/media-kit/:filename
```

**cURL:**
```bash
curl -X DELETE http://localhost:3001/api/upload/media-kit/talent-123.jpg
```

**JavaScript:**
```javascript
fetch('https://backend-isadora.onrender.com/api/upload/media-kit/talent-123.jpg', {
  method: 'DELETE'
}).then(res => res.json());
```

---

### 3️⃣ List All Files (Admin)
```bash
GET /api/admin/media-kits
```

**cURL:**
```bash
# Get admin token first
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@talento.com","password":"password"}' \
  | jq -r '.data.token')

# List files
curl -X GET http://localhost:3001/api/admin/media-kits \
  -H "Authorization: Bearer $TOKEN"
```

**JavaScript:**
```javascript
fetch('https://backend-isadora.onrender.com/api/admin/media-kits', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
}).then(res => res.json());
```

---

### 4️⃣ Access Uploaded File
```bash
GET /uploads/media-kits/:filename
```

**Direct URL:**
```
https://backend-isadora.onrender.com/uploads/media-kits/talent-123.jpg
```

**HTML:**
```html
<img src="https://backend-isadora.onrender.com/uploads/media-kits/talent-123.jpg" alt="Photo">
```

---

## 📋 Validation Rules

| Rule | Value |
|------|-------|
| Max File Size | 10 MB |
| Max Files per Upload | 10 files |
| Allowed Types | JPEG, JPG, PNG, GIF, WebP, PDF |
| Filename Format | `talent-{timestamp}-{random}.{ext}` |

---

## 🔑 Default Admin Credentials

```
Email: admin@talento.com
Password: password
```

---

## 🧪 Test Script

```bash
./test-upload.sh
```

---

## 📁 File Locations

| Type | Path |
|------|------|
| Uploaded Files | `uploads/media-kits/` |
| Server Code | `server.js` |
| API Docs | `FILE_UPLOAD_API.md` |
| Full Summary | `IMPLEMENTATION_SUMMARY.md` |

---

## 🌐 Production URLs

| Environment | Base URL |
|------------|----------|
| Local | `http://localhost:3001` |
| Production | `https://backend-isadora.onrender.com` |

---

## ⚡ Common Tasks

### Upload Multiple Files
```javascript
const files = [file1, file2, file3];
const formData = new FormData();
files.forEach(file => formData.append('mediaKit', file));

fetch('/api/upload/media-kit', {
  method: 'POST',
  body: formData
});
```

### Display Uploaded Images
```javascript
// After upload
response.urls.forEach(url => {
  const img = document.createElement('img');
  img.src = url;
  document.body.appendChild(img);
});
```

### Check Upload Status
```javascript
const response = await fetch('/api/upload/media-kit', {
  method: 'POST',
  body: formData
});

if (response.ok) {
  const result = await response.json();
  console.log('Uploaded:', result.files.length, 'files');
} else {
  console.error('Upload failed');
}
```

---

## 🔴 Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | No files / Invalid input |
| 401 | Missing auth token |
| 403 | Not admin / Invalid token |
| 404 | File not found |
| 500 | Server error / File too large |

---

## 💡 Tips

1. **File Size**: Keep images under 10MB
2. **File Types**: Use JPEG for photos, PNG for graphics, PDF for documents
3. **Naming**: Server auto-generates safe filenames
4. **Storage**: Files stored in `uploads/media-kits/`
5. **Production**: Consider using S3 or Cloudinary for permanent storage

---

## 📞 Need Help?

1. Check full docs: `FILE_UPLOAD_API.md`
2. Read implementation details: `IMPLEMENTATION_SUMMARY.md`
3. Run tests: `./test-upload.sh`
4. Check server logs for errors

---

**Ready to use! 🎉**

