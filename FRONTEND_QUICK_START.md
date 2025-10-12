# 🚀 Frontend Quick Start - Cloudinary Upload

## ⚡ Quick Copy-Paste Code

### 1. Upload Files

```javascript
// Upload function
async function uploadFiles(files, userId = null, talentId = null) {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('mediaKit', file);
  });
  
  if (userId) formData.append('userId', userId);
  if (talentId) formData.append('talentId', talentId);

  const response = await fetch('https://backend-isadora.onrender.com/api/upload/media-kit', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  
  if (result.success) {
    return result.files; // Array of { id, url, originalName, size }
  }
  
  throw new Error(result.error || 'Upload failed');
}

// Usage in React
function UploadButton() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    setUploading(true);
    try {
      const uploadedFiles = await uploadFiles(files);
      console.log('Uploaded:', uploadedFiles);
      // Save URLs: uploadedFiles[0].url, uploadedFiles[1].url, etc.
    } catch (error) {
      alert('Upload failed: ' + error.message);
    }
    setUploading(false);
  };

  return (
    <>
      <input 
        type="file" 
        multiple 
        onChange={(e) => setFiles(Array.from(e.target.files))}
      />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </>
  );
}
```

---

### 2. Display Images from Cloudinary

```javascript
// Simple display
function ImageGallery({ imageUrls }) {
  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {imageUrls.map((url, index) => (
        <img 
          key={index}
          src={url}
          alt={`Image ${index + 1}`}
          style={{ width: 200, height: 200, objectFit: 'cover' }}
          loading="lazy"
        />
      ))}
    </div>
  );
}

// Usage
<ImageGallery imageUrls={[
  "https://res.cloudinary.com/djecxub3z/image/upload/.../talent-1.jpg",
  "https://res.cloudinary.com/djecxub3z/image/upload/.../talent-2.jpg"
]} />
```

---

### 3. Fetch Talents with Images

```javascript
async function fetchTalents() {
  const response = await fetch('https://backend-isadora.onrender.com/api/talents');
  const result = await response.json();
  
  if (result.success) {
    return result.data; // Array of talents with mediaKitUrls
  }
  
  throw new Error('Failed to fetch talents');
}

// Usage in React
function TalentList() {
  const [talents, setTalents] = useState([]);

  useEffect(() => {
    fetchTalents().then(setTalents);
  }, []);

  return (
    <div>
      {talents.map(talent => (
        <div key={talent.id}>
          <h3>{talent.fullName}</h3>
          {talent.mediaKitUrls && talent.mediaKitUrls.length > 0 && (
            <img 
              src={talent.mediaKitUrls[0]} 
              alt={talent.fullName}
              style={{ width: 300, height: 300, objectFit: 'cover' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

---

### 4. Submit Talent Application with Images

```javascript
async function submitApplication(formData, files, authToken) {
  // Step 1: Upload files to Cloudinary
  const uploadedFiles = await uploadFiles(files);
  const mediaKitUrls = uploadedFiles.map(f => f.url);

  // Step 2: Submit application with Cloudinary URLs
  const response = await fetch('https://backend-isadora.onrender.com/api/talent/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
      ...formData,
      mediaKitUrls: mediaKitUrls, // ← Cloudinary URLs
      termsAccepted: true
    })
  });

  const result = await response.json();
  
  if (result.success) {
    return result.data;
  }
  
  throw new Error(result.message || 'Application failed');
}

// Usage
function ApplicationForm({ authToken }) {
  const [formData, setFormData] = useState({ fullName: '', city: '' });
  const [files, setFiles] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitApplication(formData, files, authToken);
      alert('Application submitted!');
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={formData.fullName}
        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
        placeholder="Full Name"
        required
      />
      <input 
        type="file" 
        multiple 
        onChange={(e) => setFiles(Array.from(e.target.files))}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

### 5. Delete File

```javascript
async function deleteFile(fileId) {
  const response = await fetch(
    `https://backend-isadora.onrender.com/api/upload/media-kit/${fileId}`,
    { method: 'DELETE' }
  );

  const result = await response.json();
  return result.success;
}

// Usage
<button onClick={() => deleteFile(file.id)}>
  Delete
</button>
```

---

## 🔑 Key Differences from Old API

| Feature | OLD API ❌ | NEW API ✅ |
|---------|-----------|-----------|
| **URL Format** | `http://backend.../uploads/file.jpg` | `https://res.cloudinary.com/.../file.jpg` |
| **Response ID** | None | `file.id` (UUID) |
| **Persistence** | Lost on restart | Permanent |
| **Delete By** | Filename | File ID |
| **Domain** | Your server | Cloudinary CDN |
| **Speed** | Server bandwidth | Global CDN |

---

## ✅ Response Format

### Upload Response
```javascript
{
  success: true,
  files: [
    {
      id: "uuid-here",           // ← Use for deletion
      url: "https://res.cloudinary.com/...",  // ← Use for display
      originalName: "photo.jpg",
      size: 123456
    }
  ],
  urls: ["https://res.cloudinary.com/..."]  // ← Quick access to URLs
}
```

### Talent Response
```javascript
{
  success: true,
  data: [
    {
      id: "talent-uuid",
      fullName: "Jane Doe",
      mediaKitUrls: [  // ← Array of Cloudinary URLs
        "https://res.cloudinary.com/.../image1.jpg",
        "https://res.cloudinary.com/.../image2.jpg"
      ],
      // ... other fields
    }
  ]
}
```

---

## 🎨 Image Optimization (Optional)

Add transformations to Cloudinary URLs:

```javascript
// Original URL
const url = "https://res.cloudinary.com/djecxub3z/image/upload/v123/talent-media-kits/file.jpg";

// Thumbnail (200x200)
const thumb = url.replace('/upload/', '/upload/w_200,h_200,c_fill/');

// Auto optimize
const optimized = url.replace('/upload/', '/upload/q_auto,f_auto/');

// Usage
<img src={optimized} />
```

---

## 📝 Checklist

### For Upload:
- [ ] Create FormData
- [ ] Append files with key `'mediaKit'`
- [ ] Send POST to `/api/upload/media-kit`
- [ ] Store `result.files` (has `id` and `url`)
- [ ] Use `file.url` to display images
- [ ] Use `file.id` to delete files

### For Display:
- [ ] Use Cloudinary URL directly in `<img src={url} />`
- [ ] Add `loading="lazy"` for performance
- [ ] Handle missing images with placeholder
- [ ] Images work immediately (no 404)

### For Talent Applications:
- [ ] Upload files first
- [ ] Get Cloudinary URLs from response
- [ ] Include URLs in application data
- [ ] Submit application with URLs

---

## 🚨 Common Mistakes

### ❌ DON'T DO THIS:
```javascript
// Old endpoint format
DELETE /api/upload/media-kit/talent-123.jpg  // ❌ Won't work

// Using old URL format
const url = "http://backend.../uploads/file.jpg"  // ❌ Will 404 after restart
```

### ✅ DO THIS:
```javascript
// New endpoint format
DELETE /api/upload/media-kit/uuid-123  // ✅ Works

// Using Cloudinary URL
const url = "https://res.cloudinary.com/djecxub3z/..."  // ✅ Permanent
```

---

## 💡 Quick Test

```bash
# Test upload
curl -X POST https://backend-isadora.onrender.com/api/upload/media-kit \
  -F "mediaKit=@photo.jpg"

# Expected response:
# {
#   "success": true,
#   "files": [{
#     "id": "uuid",
#     "url": "https://res.cloudinary.com/djecxub3z/..."
#   }]
# }
```

---

## 📖 Full Documentation

See **FRONTEND_INTEGRATION.md** for complete examples and best practices.

---

**That's it! Your images now work forever!** 🎉

