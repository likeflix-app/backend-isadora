# 🎨 Frontend Integration Guide - Cloudinary Upload

## Overview

This guide shows how to properly upload files and display Cloudinary images in your frontend.

---

## 📤 1. Upload Files to Cloudinary

### React Example - File Upload Component

```javascript
import React, { useState } from 'react';

function MediaKitUploader({ talentId, userId }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      // Add all files
      files.forEach(file => {
        formData.append('mediaKit', file);
      });
      
      // Optional: Associate with user or talent
      if (userId) formData.append('userId', userId);
      if (talentId) formData.append('talentId', talentId);

      // Upload to backend (which uploads to Cloudinary)
      const response = await fetch('https://backend-isadora.onrender.com/api/upload/media-kit', {
        method: 'POST',
        body: formData
        // No Content-Type header needed - browser sets it automatically with boundary
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Upload successful:', result);
        setUploadedFiles(result.files);
        setFiles([]); // Clear selected files
        
        // Return the uploaded files data for further use
        return result.files;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
      
    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="media-kit-uploader">
      <h3>Upload Media Kit</h3>
      
      <input 
        type="file" 
        multiple 
        accept="image/*,.pdf"
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {files.length > 0 && (
        <p>Selected: {files.length} file(s)</p>
      )}
      
      <button 
        onClick={handleUpload} 
        disabled={uploading || files.length === 0}
      >
        {uploading ? 'Uploading...' : 'Upload Files'}
      </button>
      
      {error && (
        <div className="error" style={{ color: 'red' }}>
          {error}
        </div>
      )}
      
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files">
          <h4>Uploaded Successfully:</h4>
          {uploadedFiles.map((file, index) => (
            <div key={file.id} className="uploaded-file">
              <img 
                src={file.url} 
                alt={file.originalName}
                style={{ width: 200, height: 200, objectFit: 'cover' }}
              />
              <p>{file.originalName}</p>
              <small>Size: {(file.size / 1024).toFixed(2)} KB</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MediaKitUploader;
```

---

## 📥 2. Upload Response Format

### New Response Structure

```javascript
{
  "success": true,
  "files": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",  // ← Use this for deletion
      "filename": "talent-1728567890-987654321",
      "originalName": "photo.jpg",
      "size": 245678,
      "url": "https://res.cloudinary.com/djecxub3z/image/upload/v1728567890/talent-media-kits/talent-1728567890-987654321.jpg",  // ← Use this to display
      "cloudinaryPublicId": "talent-media-kits/talent-1728567890-987654321"
    }
  ],
  "urls": [
    "https://res.cloudinary.com/djecxub3z/image/upload/v1728567890/talent-media-kits/talent-1728567890-987654321.jpg"
  ],
  "message": "Files uploaded to Cloudinary and saved to database"
}
```

### Key Changes from Old API:

| Field | Old API | New API |
|-------|---------|---------|
| `id` | ❌ Not provided | ✅ UUID for database |
| `url` | `http://backend.../uploads/...` | `https://res.cloudinary.com/...` |
| Domain | Your backend server | Cloudinary CDN |
| Persistence | ❌ Lost on restart | ✅ Permanent |

---

## 🖼️ 3. Display Images from Cloudinary

### Simple Image Display

```javascript
function ImageGallery({ imageUrls }) {
  return (
    <div className="image-gallery">
      {imageUrls.map((url, index) => (
        <img 
          key={index}
          src={url}
          alt={`Media ${index + 1}`}
          style={{ width: 300, height: 300, objectFit: 'cover' }}
          loading="lazy"
        />
      ))}
    </div>
  );
}
```

### With Cloudinary Transformations

```javascript
function OptimizedImage({ cloudinaryUrl, alt, width = 300, height = 300 }) {
  // Extract the base URL and add transformations
  const getTransformedUrl = (url, transformations) => {
    // Cloudinary URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/path.jpg
    // Insert transformations after /upload/
    return url.replace('/upload/', `/upload/${transformations}/`);
  };

  // Different sizes for responsive images
  const thumbnail = getTransformedUrl(cloudinaryUrl, 'w_200,h_200,c_fill');
  const medium = getTransformedUrl(cloudinaryUrl, 'w_600,h_600,c_fit');
  const optimized = getTransformedUrl(cloudinaryUrl, 'q_auto,f_auto');

  return (
    <picture>
      <source media="(max-width: 480px)" srcSet={thumbnail} />
      <source media="(max-width: 1024px)" srcSet={medium} />
      <img 
        src={optimized}
        alt={alt}
        style={{ width, height, objectFit: 'cover' }}
        loading="lazy"
      />
    </picture>
  );
}
```

---

## 🔄 4. Complete Talent Application Form

### Full Example with Upload Integration

```javascript
import React, { useState } from 'react';

function TalentApplicationForm({ userId, authToken }) {
  const [formData, setFormData] = useState({
    fullName: '',
    birthYear: '',
    city: '',
    phone: '',
    bio: '',
    // ... other fields
  });
  
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Upload media files first
  const uploadMedia = async () => {
    if (mediaFiles.length === 0) return [];

    const formData = new FormData();
    mediaFiles.forEach(file => {
      formData.append('mediaKit', file);
    });
    formData.append('userId', userId);

    const response = await fetch('https://backend-isadora.onrender.com/api/upload/media-kit', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.success) {
      return result.urls; // Return Cloudinary URLs
    }
    throw new Error('Upload failed');
  };

  // Step 2: Submit application with Cloudinary URLs
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Upload files first and get Cloudinary URLs
      const mediaKitUrls = await uploadMedia();

      // Submit application with Cloudinary URLs
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
        alert('Application submitted successfully!');
        // Reset form or redirect
      } else {
        throw new Error(result.message);
      }
      
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit application: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Talent Application</h2>
      
      <input
        type="text"
        placeholder="Full Name"
        value={formData.fullName}
        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
        required
      />
      
      {/* ... other form fields ... */}
      
      <div className="media-kit-section">
        <h3>Media Kit (Photos/PDFs)</h3>
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={(e) => setMediaFiles(Array.from(e.target.files))}
        />
        {mediaFiles.length > 0 && (
          <p>Selected: {mediaFiles.length} file(s)</p>
        )}
      </div>
      
      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  );
}

export default TalentApplicationForm;
```

---

## 📋 5. Fetch and Display Talent Profiles

### Fetch Verified Talents with Images

```javascript
import React, { useState, useEffect } from 'react';

function TalentShowcase() {
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTalents();
  }, []);

  const fetchTalents = async () => {
    try {
      const response = await fetch('https://backend-isadora.onrender.com/api/talents');
      const result = await response.json();
      
      if (result.success) {
        setTalents(result.data);
      } else {
        throw new Error('Failed to fetch talents');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading talents...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="talent-showcase">
      <h1>Our Talents</h1>
      
      <div className="talent-grid">
        {talents.map(talent => (
          <TalentCard key={talent.id} talent={talent} />
        ))}
      </div>
    </div>
  );
}

function TalentCard({ talent }) {
  const {
    fullName,
    nickname,
    city,
    bio,
    mediaKitUrls, // ← Array of Cloudinary URLs
    socialChannels,
    contentCategories,
    isCelebrity
  } = talent;

  // Get first image or placeholder
  const mainImage = mediaKitUrls && mediaKitUrls.length > 0 
    ? mediaKitUrls[0] 
    : 'https://via.placeholder.com/300x300?text=No+Image';

  return (
    <div className="talent-card">
      {isCelebrity && <span className="celebrity-badge">⭐ Celebrity</span>}
      
      <div className="talent-image">
        <img 
          src={mainImage}
          alt={fullName}
          style={{ width: '100%', height: 300, objectFit: 'cover' }}
          loading="lazy"
        />
      </div>
      
      <div className="talent-info">
        <h3>{nickname || fullName}</h3>
        <p className="location">📍 {city}</p>
        <p className="bio">{bio}</p>
        
        {contentCategories && contentCategories.length > 0 && (
          <div className="categories">
            {contentCategories.map((cat, i) => (
              <span key={i} className="category-tag">{cat}</span>
            ))}
          </div>
        )}
        
        {socialChannels && socialChannels.length > 0 && (
          <div className="social-channels">
            {socialChannels.map((channel, i) => (
              <span key={i} className="social-icon">{channel}</span>
            ))}
          </div>
        )}
        
        {mediaKitUrls && mediaKitUrls.length > 1 && (
          <div className="image-gallery-preview">
            {mediaKitUrls.slice(1, 4).map((url, i) => (
              <img 
                key={i}
                src={url}
                alt={`${fullName} ${i + 2}`}
                style={{ width: 80, height: 80, objectFit: 'cover' }}
              />
            ))}
            {mediaKitUrls.length > 4 && (
              <div className="more-images">+{mediaKitUrls.length - 4}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TalentShowcase;
```

---

## 🗑️ 6. Delete Files

### Delete File by ID

```javascript
async function deleteFile(fileId, authToken) {
  try {
    const response = await fetch(
      `https://backend-isadora.onrender.com/api/upload/media-kit/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}` // Optional: if you add auth
        }
      }
    );

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ File deleted:', result.deletedFile);
      return true;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('❌ Delete error:', error);
    return false;
  }
}

// Usage in component
function FileManager({ files, onFileDeleted }) {
  const handleDelete = async (fileId) => {
    if (confirm('Are you sure you want to delete this file?')) {
      const success = await deleteFile(fileId, authToken);
      if (success) {
        onFileDeleted(fileId);
      }
    }
  };

  return (
    <div className="file-manager">
      {files.map(file => (
        <div key={file.id} className="file-item">
          <img src={file.url} alt={file.originalName} />
          <button onClick={() => handleDelete(file.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎨 7. Image Optimization Tips

### Cloudinary URL Transformations

```javascript
// Original URL from API:
// https://res.cloudinary.com/djecxub3z/image/upload/v123/talent-media-kits/talent-456.jpg

// Add transformations between /upload/ and version number:

// Thumbnail (200x200, cropped)
const thumbnail = url.replace('/upload/', '/upload/w_200,h_200,c_fill/');

// Auto quality and format
const optimized = url.replace('/upload/', '/upload/q_auto,f_auto/');

// Blur placeholder for lazy loading
const blurPlaceholder = url.replace('/upload/', '/upload/w_50,e_blur:1000/');

// Grayscale effect
const grayscale = url.replace('/upload/', '/upload/e_grayscale/');

// Round corners
const rounded = url.replace('/upload/', '/upload/r_20/');
```

### React Component with Optimization

```javascript
function CloudinaryImage({ 
  url, 
  alt, 
  width = 300, 
  height = 300,
  transformation = 'q_auto,f_auto' 
}) {
  const getOptimizedUrl = (baseUrl, transforms) => {
    return baseUrl.replace('/upload/', `/upload/${transforms}/`);
  };

  const optimizedUrl = getOptimizedUrl(url, transformation);
  const blurUrl = getOptimizedUrl(url, 'w_50,e_blur:1000,q_auto');

  const [loaded, setLoaded] = useState(false);

  return (
    <div 
      style={{ 
        position: 'relative', 
        width, 
        height,
        overflow: 'hidden'
      }}
    >
      {/* Blur placeholder */}
      {!loaded && (
        <img 
          src={blurUrl}
          alt=""
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(10px)',
            transform: 'scale(1.1)'
          }}
        />
      )}
      
      {/* Actual image */}
      <img 
        src={optimizedUrl}
        alt={alt}
        onLoad={() => setLoaded(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s'
        }}
        loading="lazy"
      />
    </div>
  );
}
```

---

## 📱 8. Responsive Image Sizes

```javascript
function ResponsiveTalentImage({ cloudinaryUrl, alt }) {
  // Generate URLs for different screen sizes
  const getResponsiveUrl = (width) => {
    return cloudinaryUrl.replace(
      '/upload/', 
      `/upload/w_${width},c_fill,q_auto,f_auto/`
    );
  };

  return (
    <img
      srcSet={`
        ${getResponsiveUrl(400)} 400w,
        ${getResponsiveUrl(800)} 800w,
        ${getResponsiveUrl(1200)} 1200w
      `}
      sizes="(max-width: 480px) 400px, (max-width: 1024px) 800px, 1200px"
      src={getResponsiveUrl(800)}
      alt={alt}
      loading="lazy"
    />
  );
}
```

---

## ⚡ 9. Best Practices

### DO ✅

1. **Use Cloudinary URLs directly** - Don't proxy through your backend
   ```javascript
   <img src={file.url} /> // ✅ Direct from Cloudinary CDN
   ```

2. **Store file IDs** - Keep the `id` field for deletion
   ```javascript
   const [uploadedFiles, setUploadedFiles] = useState([]);
   // Store: { id, url, originalName, size }
   ```

3. **Add loading states** - Show upload progress
   ```javascript
   {uploading && <Spinner />}
   ```

4. **Handle errors gracefully**
   ```javascript
   catch (error) {
     setError(error.message);
     alert('Upload failed. Please try again.');
   }
   ```

5. **Use lazy loading** - Better performance
   ```javascript
   <img loading="lazy" src={url} />
   ```

### DON'T ❌

1. **Don't use old URLs** - They won't work after restart
   ```javascript
   // ❌ Old format (broken after restart)
   // http://backend.../uploads/media-kits/file.jpg
   
   // ✅ New format (works forever)
   // https://res.cloudinary.com/djecxub3z/image/upload/.../file.jpg
   ```

2. **Don't delete by filename** - Use file ID
   ```javascript
   // ❌ Old API
   DELETE /api/upload/media-kit/talent-123.jpg
   
   // ✅ New API
   DELETE /api/upload/media-kit/a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```

3. **Don't skip error handling**
   ```javascript
   // ❌ Bad
   await fetch(url);
   
   // ✅ Good
   try {
     const response = await fetch(url);
     if (!response.ok) throw new Error();
   } catch (error) {
     handleError(error);
   }
   ```

---

## 🧪 10. Testing Checklist

- [ ] Upload single file
- [ ] Upload multiple files
- [ ] Display uploaded images
- [ ] Delete uploaded file
- [ ] Show loading states
- [ ] Handle errors
- [ ] Images persist after backend restart
- [ ] Images load fast (CDN)
- [ ] Lazy loading works
- [ ] Responsive images work
- [ ] Mobile upload works

---

## 📊 11. Example API Response

### Upload Response
```json
{
  "success": true,
  "files": [
    {
      "id": "file-uuid-123",
      "filename": "talent-1728567890-987654321",
      "originalName": "my-photo.jpg",
      "size": 245678,
      "url": "https://res.cloudinary.com/djecxub3z/image/upload/v1728567890/talent-media-kits/talent-1728567890-987654321.jpg",
      "cloudinaryPublicId": "talent-media-kits/talent-1728567890-987654321"
    }
  ],
  "urls": [
    "https://res.cloudinary.com/djecxub3z/image/upload/v1728567890/talent-media-kits/talent-1728567890-987654321.jpg"
  ],
  "message": "Files uploaded to Cloudinary and saved to database"
}
```

### Talent Profile Response
```json
{
  "success": true,
  "data": [
    {
      "id": "talent-uuid",
      "fullName": "Jane Doe",
      "nickname": "JaneD",
      "mediaKitUrls": [
        "https://res.cloudinary.com/djecxub3z/image/upload/.../talent-1.jpg",
        "https://res.cloudinary.com/djecxub3z/image/upload/.../talent-2.jpg"
      ],
      "isCelebrity": false,
      "clickCount": 42
    }
  ]
}
```

---

## 🎉 Summary

Your frontend should now:
1. ✅ Upload files to Cloudinary (via your backend)
2. ✅ Receive permanent Cloudinary URLs
3. ✅ Display images from Cloudinary CDN
4. ✅ Delete files using database IDs
5. ✅ Handle errors and loading states

**Images will never return 404 again!** 🚀

