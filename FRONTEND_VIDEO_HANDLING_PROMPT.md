# Frontend Video Handling Implementation Guide

## 🎯 Overview
The backend now supports video uploads (`.mov`, `.mp4`, `.avi`, `.wmv`, `.flv`, `.webm`, `.mkv`, `.m4v`, `.mpeg`, `.mpg`) alongside images in the talent media kit. The frontend needs to be updated to handle video files in all relevant areas.

---

## 📋 Backend API Details

### Upload Endpoint
**POST** `/api/upload/media-kit`
- Accepts: `multipart/form-data`
- Field name: `mediaKit` (array, max 10 files)
- Supported formats: 
  - **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.pdf`
  - **Videos**: `.mp4`, `.mov`, `.avi`, `.wmv`, `.flv`, `.webm`, `.mkv`, `.m4v`, `.mpeg`, `.mpg`
- Max file size: **100MB** per file

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "uuid",
      "filename": "string",
      "originalName": "string",
      "size": 123456,
      "url": "https://res.cloudinary.com/...",
      "cloudinaryPublicId": "string"
    }
  ],
  "urls": [
    "https://res.cloudinary.com/..."
  ]
}
```

### Talent Application
When submitting or updating a talent application, the `mediaKitUrls` field is an **array of strings** that can contain both image and video URLs.

**Example:**
```json
{
  "mediaKitUrls": [
    "https://res.cloudinary.com/.../image.jpg",
    "https://res.cloudinary.com/.../video.mov",
    "https://res.cloudinary.com/.../image.png"
  ]
}
```

---

## 🎨 Implementation Requirements

### 1. **File Upload Component**

#### File Type Detection
```javascript
function getMediaType(url) {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.mpeg', '.mpg'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
  
  const lowerUrl = url.toLowerCase();
  
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return 'video';
  }
  if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
    return 'image';
  }
  return 'unknown';
}
```

#### File Input Acceptance
Update your file input to accept both images and videos:
```html
<input 
  type="file" 
  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/x-flv,video/webm,video/x-matroska"
  multiple
  max="10"
/>
```

#### Upload Validation
```javascript
function validateFile(file) {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv',
    'video/x-flv', 'video/webm', 'video/x-matroska', 'video/mpeg'
  ];
  
  if (file.size > maxSize) {
    throw new Error(`File ${file.name} exceeds 100MB limit`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not supported`);
  }
  
  return true;
}
```

---

### 2. **Media Kit Preview/Display Component**

Create a reusable component that can display both images and videos:

#### React Example:
```jsx
function MediaKitItem({ url, onRemove, index }) {
  const mediaType = getMediaType(url);
  
  return (
    <div className="media-kit-item">
      {mediaType === 'video' ? (
        <div className="video-container">
          <video 
            src={url} 
            controls 
            preload="metadata"
            className="media-preview"
          >
            Your browser does not support the video tag.
          </video>
          <span className="media-badge video-badge">🎬 Video</span>
        </div>
      ) : (
        <div className="image-container">
          <img 
            src={url} 
            alt={`Media ${index + 1}`}
            className="media-preview"
            loading="lazy"
          />
        </div>
      )}
      
      {onRemove && (
        <button 
          onClick={() => onRemove(url)} 
          className="remove-btn"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function MediaKitGallery({ urls, onRemove }) {
  return (
    <div className="media-kit-gallery">
      {urls.map((url, index) => (
        <MediaKitItem 
          key={url} 
          url={url} 
          index={index}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
```

#### Vue Example:
```vue
<template>
  <div class="media-kit-item">
    <div v-if="isVideo" class="video-container">
      <video 
        :src="url" 
        controls 
        preload="metadata"
        class="media-preview"
      >
        Your browser does not support the video tag.
      </video>
      <span class="media-badge video-badge">🎬 Video</span>
    </div>
    
    <div v-else class="image-container">
      <img 
        :src="url" 
        :alt="`Media ${index + 1}`"
        class="media-preview"
        loading="lazy"
      />
    </div>
    
    <button 
      v-if="onRemove" 
      @click="onRemove(url)"
      class="remove-btn"
    >
      ✕
    </button>
  </div>
</template>

<script>
export default {
  props: {
    url: String,
    index: Number,
    onRemove: Function
  },
  computed: {
    isVideo() {
      const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.mpeg', '.mpg'];
      return videoExtensions.some(ext => this.url.toLowerCase().includes(ext));
    }
  }
}
</script>
```

---

### 3. **Suggested CSS Styles**

```css
.media-kit-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
}

.media-kit-item {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
  background: #f5f5f5;
}

.media-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-container video {
  background: #000;
}

.media-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.video-badge {
  background: rgba(220, 38, 38, 0.9);
}

.remove-btn {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: rgba(185, 28, 28, 1);
}

/* For better video controls visibility */
.video-container video::-webkit-media-controls {
  background: rgba(0, 0, 0, 0.5);
}
```

---

## 🔧 Implementation Scenarios

### **Scenario 1: Talent Application Form (User Side)**

**Location:** When a user is filling out their talent application and uploading their media kit.

**Requirements:**
- ✅ Allow users to upload both images and videos
- ✅ Show preview of all uploaded media (images + videos)
- ✅ Display video badge/indicator to distinguish from images
- ✅ Allow removing individual media items before submission
- ✅ Show file type and size during upload
- ✅ Display upload progress for large video files
- ✅ Validate file size (max 100MB) and file type before upload

**User Flow:**
1. User clicks "Upload Media Kit" button
2. File picker shows (accepts images + videos)
3. User selects files (can mix images and videos)
4. Files are validated (size, type)
5. Upload starts with progress indicator
6. Preview shows all uploaded media with appropriate rendering (img tag for images, video tag for videos)
7. User can remove any item before final submission
8. On submit, all URLs are added to `mediaKitUrls` array

---

### **Scenario 2: Talent Profile View (Public/User View)**

**Location:** When viewing a verified talent's profile on the public gallery or talent listing page.

**Requirements:**
- ✅ Display all media kit items (images + videos) in a grid/gallery
- ✅ Videos should have play controls
- ✅ Videos should show a clear indicator (badge) that they're videos
- ✅ Support lightbox/modal view for full-screen media viewing
- ✅ Videos should not autoplay (user-initiated playback only)
- ✅ Consider lazy loading for better performance

**User Flow:**
1. User browses to talent profile
2. Media kit section shows all images and videos in a grid
3. Videos have a play button overlay or badge
4. User can click to play video inline or open in lightbox
5. Videos have standard browser controls (play, pause, volume, fullscreen)

**Example Structure:**
```jsx
<div className="talent-profile">
  <h2>{talent.fullName}</h2>
  <div className="media-kit-section">
    <h3>Media Kit</h3>
    <MediaKitGallery urls={talent.mediaKitUrls} />
  </div>
</div>
```

---

### **Scenario 3: Admin Dashboard - Application Review**

**Location:** Admin reviewing pending talent applications.

**Requirements:**
- ✅ Show all media kit items submitted by the applicant
- ✅ Clearly distinguish videos from images
- ✅ Allow admin to view all media in full size/quality
- ✅ Show metadata: file type, size, upload date
- ✅ Videos should be playable inline

**User Flow:**
1. Admin opens pending application
2. Application details show media kit section
3. All images and videos are displayed
4. Videos are clearly marked with badge
5. Admin can click to view full-size or play videos
6. Admin reviews and approves/rejects application

---

### **Scenario 4: Profile Editing (User Side)**

**Location:** When a verified talent wants to update their media kit.

**Requirements:**
- ✅ Show current media kit items (images + videos)
- ✅ Allow adding new media (images or videos)
- ✅ Allow removing existing media
- ✅ Maintain order of media items
- ✅ Show clear indication of changes before saving

**User Flow:**
1. User navigates to "Edit Profile" or "Edit Application"
2. Current media kit is displayed with all images and videos
3. User can:
   - Click "Add Media" to upload new files
   - Click "✕" on any item to remove it
   - Drag to reorder (optional)
4. Changes are highlighted (new items, removed items)
5. User clicks "Save Changes"
6. PATCH request updates `mediaKitUrls` array

**Example API Call:**
```javascript
async function updateMediaKit(applicationId, newMediaKitUrls) {
  const response = await fetch(
    `/api/talent/applications/${applicationId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        mediaKitUrls: newMediaKitUrls
      })
    }
  );
  return response.json();
}
```

---

### **Scenario 5: Mobile Responsive View**

**Requirements:**
- ✅ Videos should work properly on mobile browsers
- ✅ Consider bandwidth - don't autoplay videos on mobile
- ✅ Use responsive video player
- ✅ Grid layout should adapt to smaller screens (2 columns on mobile)
- ✅ Video controls should be touch-friendly

**Mobile Considerations:**
```css
@media (max-width: 768px) {
  .media-kit-gallery {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;
  }
  
  .media-kit-item {
    aspect-ratio: 1 / 1;
  }
}

@media (max-width: 480px) {
  .media-kit-gallery {
    grid-template-columns: 1fr;
  }
}
```

---

## 🎬 Video Player Best Practices

### 1. **Performance Optimization**
```javascript
// Use preload="metadata" to load only video metadata, not the entire video
<video src={url} preload="metadata" controls />

// For thumbnails, you can use Cloudinary transformation
function getVideoThumbnail(videoUrl) {
  // Cloudinary automatically generates thumbnails for videos
  return videoUrl.replace('/upload/', '/upload/so_0,f_jpg/');
}
```

### 2. **Accessibility**
```html
<video controls aria-label="Talent showcase video">
  <source src="video.mp4" type="video/mp4">
  <source src="video.webm" type="video/webm">
  Your browser does not support the video tag.
</video>
```

### 3. **Error Handling**
```javascript
function VideoPlayer({ url }) {
  const [error, setError] = useState(false);
  
  return (
    <div className="video-player">
      {!error ? (
        <video 
          src={url} 
          controls 
          preload="metadata"
          onError={() => setError(true)}
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="video-error">
          <p>⚠️ Unable to load video</p>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Open video in new tab
          </a>
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### File Upload
- [ ] Can upload video files (.mp4, .mov, etc.)
- [ ] Can upload image files (.jpg, .png, etc.)
- [ ] Can upload mix of images and videos in single upload
- [ ] File size validation works (100MB limit)
- [ ] File type validation works
- [ ] Upload progress shown for large files
- [ ] Error handling for failed uploads
- [ ] Can upload up to 10 files at once

### Display & Playback
- [ ] Videos display correctly in gallery view
- [ ] Video controls work (play, pause, volume, fullscreen)
- [ ] Videos don't autoplay
- [ ] Video badge/indicator shows on video items
- [ ] Images display correctly alongside videos
- [ ] Lazy loading works for better performance
- [ ] Responsive layout works on mobile
- [ ] Videos work on iOS Safari
- [ ] Videos work on Android Chrome

### CRUD Operations
- [ ] Can remove videos from media kit
- [ ] Can add new videos to existing media kit
- [ ] Can edit/update application with videos
- [ ] Can view applications with videos in admin dashboard
- [ ] Media kit URLs persist correctly in database

### Edge Cases
- [ ] Handle corrupt video files gracefully
- [ ] Handle unsupported video formats
- [ ] Handle very large files (near 100MB limit)
- [ ] Handle slow internet connections (show loading state)
- [ ] Handle empty media kit arrays
- [ ] Handle mixed content (http/https) warnings

---

## 📦 Recommended Libraries (Optional)

For enhanced video handling, consider these libraries:

### Video Players:
- **Video.js** - Advanced HTML5 video player
  ```bash
  npm install video.js
  ```

- **React Player** - React component for playing videos
  ```bash
  npm install react-player
  ```

### Lightbox/Modal:
- **react-image-lightbox** - For full-screen image/video viewing
  ```bash
  npm install react-image-lightbox
  ```

- **Fancybox** - Supports both images and videos
  ```bash
  npm install @fancyapps/ui
  ```

---

## 🚨 Common Pitfalls to Avoid

1. **Don't autoplay videos** - This annoys users and wastes bandwidth
2. **Don't load full videos on page load** - Use `preload="metadata"`
3. **Don't forget mobile testing** - Video support varies across browsers
4. **Don't skip file validation** - Always validate size and type before upload
5. **Don't forget loading states** - Video uploads can take time
6. **Don't hardcode file extensions** - Use the helper function to detect media type
7. **Don't forget error handling** - Videos can fail to load for many reasons

---

## 🎯 Priority Implementation Order

### Phase 1 (Critical):
1. Update file input to accept videos
2. Update upload validation to allow video types
3. Create media type detection function
4. Update media display component to render videos

### Phase 2 (Important):
5. Add video badge/indicator
6. Implement remove functionality for videos
7. Add loading states for video uploads
8. Mobile responsive layout

### Phase 3 (Enhancement):
9. Video thumbnail generation
10. Lightbox/modal for full-screen viewing
11. Drag-and-drop upload
12. Progress bar for large uploads

---

## 📞 Backend Support

If you encounter any issues or need backend changes:

### Backend Endpoints:
- **Upload**: `POST /api/upload/media-kit`
- **Delete**: `DELETE /api/upload/media-kit/:id`
- **Get Talent**: `GET /api/talents` (public)
- **Update Application**: `PATCH /api/talent/applications/:id` (authenticated)

### Backend Maintainer:
Contact the backend team for:
- File size limit adjustments
- New video format support
- API endpoint modifications
- Cloudinary configuration changes

---

## ✅ Definition of Done

The video handling feature is complete when:

1. ✅ Users can upload videos through the talent application form
2. ✅ Videos display correctly in all views (profile, admin, gallery)
3. ✅ Videos are clearly distinguished from images (badge/indicator)
4. ✅ Video playback works on desktop and mobile
5. ✅ File validation prevents invalid uploads
6. ✅ Error handling provides clear user feedback
7. ✅ All existing image functionality still works
8. ✅ Responsive design works across all screen sizes
9. ✅ Performance is acceptable (no page lag from videos)
10. ✅ All test cases pass

---

## 📚 Additional Resources

- [MDN: Video and Audio Content](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Video_and_audio_content)
- [Cloudinary Video Transformations](https://cloudinary.com/documentation/video_manipulation_and_delivery)
- [Web Video Best Practices](https://web.dev/fast/#optimize-your-images)

---

**Last Updated:** October 14, 2025
**Backend API Version:** v1.0
**Video Support:** ✅ Enabled

