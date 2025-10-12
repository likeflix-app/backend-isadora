# Cloud Storage Solution for Image Uploads

## Problem
Render's ephemeral filesystem loses uploaded files on restart/redeploy. Images become unreachable.

## Recommended Solution: Cloudinary

### Why Cloudinary?
- ✅ Free tier: 25GB storage, 25GB bandwidth/month
- ✅ Auto image optimization & transformations
- ✅ CDN delivery (fast worldwide)
- ✅ Easy Node.js integration
- ✅ No server restarts needed

### Implementation Steps

#### 1. Install Cloudinary
```bash
npm install cloudinary multer-storage-cloudinary
```

#### 2. Add Environment Variables
Add to your Render dashboard:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### 3. Update server.js

Replace the multer configuration (lines 34-65) with:

```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer configuration for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'talent-media-kits',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
    resource_type: 'auto',
    transformation: [{ width: 2000, height: 2000, crop: 'limit' }]
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10
  }
});
```

#### 4. Update Upload Endpoint (line 734-764)

Replace with:

```javascript
// POST /api/upload/media-kit - Upload talent photos
app.post('/api/upload/media-kit', 
  upload.array('mediaKit', 10), 
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      console.log('📤 POST /api/upload/media-kit - Uploaded', req.files.length, 'files to Cloudinary');

      // Cloudinary URLs are already in req.files
      const fileUrls = req.files.map(file => file.path);

      res.json({
        success: true,
        files: req.files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          url: file.path, // Cloudinary URL
          cloudinaryId: file.filename
        })),
        urls: fileUrls
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
```

#### 5. Update Delete Endpoint (line 767-787)

Replace with:

```javascript
// DELETE /api/upload/media-kit/:filename - Delete uploaded file
app.delete('/api/upload/media-kit/:filename', async (req, res) => {
  try {
    const cloudinaryId = req.params.filename;
    
    console.log('🗑️ DELETE /api/upload/media-kit/:filename - Deleting from Cloudinary:', cloudinaryId);
    
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(`talent-media-kits/${cloudinaryId}`);
    
    if (result.result === 'ok') {
      console.log('✅ File deleted successfully:', cloudinaryId);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      console.log('⚠️ File not found:', cloudinaryId);
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

#### 6. Remove Static File Serving (line 68)

Comment out or remove:
```javascript
// No longer needed with Cloudinary
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

### Benefits
- ✅ Images persist across deployments
- ✅ Automatic image optimization
- ✅ CDN delivery (faster loading)
- ✅ Image transformations available
- ✅ No local storage needed

### Getting Cloudinary Credentials

1. Sign up: https://cloudinary.com/users/register/free
2. Dashboard → Account Details
3. Copy: Cloud Name, API Key, API Secret
4. Add to Render environment variables

---

## Alternative: AWS S3

If you prefer AWS S3:

```bash
npm install multer-s3 @aws-sdk/client-s3
```

Configuration similar but requires AWS account and bucket setup.

---

## Quick Fix for Testing (Not Recommended for Production)

If you want to keep filesystem storage temporarily, fix the URL generation:

```javascript
// Force HTTPS for production
const protocol = process.env.NODE_ENV === 'production' ? 'https' : req.protocol;
const host = req.get('host');
return `${protocol}://${host}/uploads/media-kits/${file.filename}`;
```

**Warning**: Files will still be lost on Render restarts!

