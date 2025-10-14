# Video Upload Quick Start Guide for Frontend

## 🚀 TL;DR - What Changed?

The backend now accepts **video files** in addition to images in the media kit. Frontend needs to:
1. Update file input to accept videos
2. Display videos with `<video>` tag instead of `<img>`
3. Show indicator to distinguish videos from images

---

## 📝 Quick Implementation Checklist

### Step 1: Update File Input
```html
<!-- OLD -->
<input type="file" accept="image/*" multiple />

<!-- NEW -->
<input 
  type="file" 
  accept="image/*,video/mp4,video/quicktime,video/webm"
  multiple 
  max="10"
/>
```

### Step 2: Detect Media Type
```javascript
function isVideo(url) {
  const videoExts = ['.mp4', '.mov', '.avi', '.wmv', '.webm', '.mkv', '.m4v'];
  return videoExts.some(ext => url.toLowerCase().includes(ext));
}
```

### Step 3: Render Appropriately
```jsx
{mediaKitUrls.map(url => (
  isVideo(url) ? (
    <video src={url} controls preload="metadata" />
  ) : (
    <img src={url} alt="Media" />
  )
))}
```

### Step 4: Add Visual Indicator
```jsx
{isVideo(url) && <span className="video-badge">🎬 Video</span>}
```

---

## 🎯 5 Key Areas to Update

| Area | What to Do |
|------|------------|
| **1. Upload Form** | Allow video file selection in file input |
| **2. Preview Component** | Show video with `<video>` tag, not `<img>` |
| **3. Profile View** | Display videos in media kit gallery |
| **4. Admin Review** | Show videos in application review |
| **5. Edit Profile** | Allow adding/removing videos |

---

## 💻 Copy-Paste Ready Code

### React Component
```jsx
function MediaItem({ url }) {
  const isVideo = ['.mp4', '.mov', '.webm'].some(ext => 
    url.toLowerCase().includes(ext)
  );
  
  return (
    <div className="media-item">
      {isVideo ? (
        <>
          <video src={url} controls preload="metadata" />
          <span className="badge">🎬</span>
        </>
      ) : (
        <img src={url} alt="Media" />
      )}
    </div>
  );
}
```

### CSS
```css
.media-item { position: relative; }
.media-item video,
.media-item img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
}
.badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
}
```

### File Validation
```javascript
function validateFile(file) {
  const maxSize = 100 * 1024 * 1024; // 100MB
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm'
  ];
  
  if (file.size > maxSize) {
    throw new Error('File too large (max 100MB)');
  }
  if (!allowed.includes(file.type)) {
    throw new Error('File type not supported');
  }
  return true;
}
```

---

## ⚡ Testing Commands

```bash
# Test these scenarios:

1. Upload a video file → Should work
2. Upload mix of images + videos → Should work
3. View profile with video in media kit → Should show video player
4. Click play on video → Should play
5. Mobile view → Should work properly
```

---

## 🎬 Supported Video Formats

✅ `.mp4` (Most common)  
✅ `.mov` (QuickTime/iPhone)  
✅ `.webm` (Web-optimized)  
✅ `.avi`, `.wmv`, `.mkv`, `.m4v` (Others)  

---

## 🚨 Important Rules

1. ❌ **DON'T** autoplay videos
2. ✅ **DO** use `controls` attribute
3. ✅ **DO** use `preload="metadata"` for performance
4. ✅ **DO** show visual indicator that it's a video
5. ✅ **DO** validate file size (max 100MB)

---

## 🆘 If Something Breaks

| Problem | Solution |
|---------|----------|
| Video won't upload | Check file type is in allowed list |
| Video won't play | Check URL is accessible |
| Shows image icon for video | Fix media type detection logic |
| Upload too slow | Expected for large files, add progress bar |

---

## 📞 Need Help?

- Full documentation: `FRONTEND_VIDEO_HANDLING_PROMPT.md`
- Backend endpoint: `POST /api/upload/media-kit`
- Example in production: Check user "werqwqr" in `/api/talents`

---

**Estimated Implementation Time:** 2-4 hours  
**Priority:** High  
**Complexity:** Low-Medium

