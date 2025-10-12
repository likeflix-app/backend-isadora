# Integrated Storage Solution: Cloudinary + PostgreSQL

## Architecture

```
User Upload → Server (multer) → Cloudinary (permanent storage) → PostgreSQL (track URLs)
```

## Why This Approach?

1. **Cloudinary**: Stores actual image files (persists across restarts)
2. **PostgreSQL**: Tracks file metadata (URLs, uploader, timestamps)
3. **Benefits**: 
   - Images never lost on restart
   - Database tracks all uploads
   - Can associate uploads with users/talents
   - Can clean up orphaned files
   - Full audit trail

## Implementation

### Step 1: Create Database Schema

Add a new table to track media uploads:

```sql
CREATE TABLE media_uploads (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  talent_id UUID REFERENCES talent_applications(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_user ON media_uploads(user_id);
CREATE INDEX idx_media_talent ON media_uploads(talent_id);
CREATE INDEX idx_media_cloudinary_id ON media_uploads(cloudinary_public_id);
```

### Step 2: Add Database Queries to db.js

Add these queries to your `db.js` file:

```javascript
const mediaQueries = {
  create: async (mediaData) => {
    const query = `
      INSERT INTO media_uploads (
        id, user_id, talent_id, filename, original_name, 
        cloudinary_url, cloudinary_public_id, file_size, mime_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await db.one(query, [
      mediaData.id,
      mediaData.userId,
      mediaData.talentId,
      mediaData.filename,
      mediaData.originalName,
      mediaData.cloudinaryUrl,
      mediaData.cloudinaryPublicId,
      mediaData.fileSize,
      mediaData.mimeType
    ]);
    return toCamelCase(result);
  },

  findById: async (id) => {
    const query = 'SELECT * FROM media_uploads WHERE id = $1';
    const result = await db.oneOrNone(query, [id]);
    return result ? toCamelCase(result) : null;
  },

  findByTalentId: async (talentId) => {
    const query = 'SELECT * FROM media_uploads WHERE talent_id = $1 ORDER BY created_at DESC';
    const results = await db.any(query, [talentId]);
    return results.map(r => toCamelCase(r));
  },

  findByUserId: async (userId) => {
    const query = 'SELECT * FROM media_uploads WHERE user_id = $1 ORDER BY created_at DESC';
    const results = await db.any(query, [userId]);
    return results.map(r => toCamelCase(r));
  },

  delete: async (id) => {
    const query = 'DELETE FROM media_uploads WHERE id = $1 RETURNING *';
    const result = await db.oneOrNone(query, [id]);
    return result ? toCamelCase(result) : null;
  },

  deleteByCloudinaryId: async (cloudinaryPublicId) => {
    const query = 'DELETE FROM media_uploads WHERE cloudinary_public_id = $1 RETURNING *';
    const result = await db.oneOrNone(query, [cloudinaryPublicId]);
    return result ? toCamelCase(result) : null;
  },

  getAll: async (limit = 100) => {
    const query = 'SELECT * FROM media_uploads ORDER BY created_at DESC LIMIT $1';
    const results = await db.any(query, [limit]);
    return results.map(r => toCamelCase(r));
  },

  getStats: async () => {
    const query = `
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT talent_id) as talents_with_media
      FROM media_uploads
    `;
    const result = await db.one(query);
    return {
      totalFiles: parseInt(result.total_files),
      totalSize: parseInt(result.total_size || 0),
      uniqueUsers: parseInt(result.unique_users),
      talentsWithMedia: parseInt(result.talents_with_media)
    };
  }
};

// Export mediaQueries
module.exports = {
  db,
  initializeDatabase,
  userQueries,
  talentQueries,
  mediaQueries, // Add this
  toCamelCase
};
```

### Step 3: Install Cloudinary

```bash
npm install cloudinary multer-storage-cloudinary
```

### Step 4: Update server.js - Import mediaQueries

```javascript
const { db, initializeDatabase, userQueries, talentQueries, mediaQueries, toCamelCase } = require('./db');
```

### Step 5: Update server.js - Configure Cloudinary

Replace lines 34-65 with:

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
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `talent-${uniqueSuffix}`;
    }
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

### Step 6: Update Upload Endpoint - Save to Database

```javascript
// POST /api/upload/media-kit - Upload talent photos
app.post('/api/upload/media-kit', 
  authenticateToken, // Optional: require authentication
  upload.array('mediaKit', 10), 
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      console.log('📤 POST /api/upload/media-kit - Uploaded', req.files.length, 'files to Cloudinary');

      // Save each file to database
      const savedFiles = await Promise.all(
        req.files.map(async (file) => {
          const mediaRecord = await mediaQueries.create({
            id: uuidv4(),
            userId: req.user?.id || null, // From auth token if available
            talentId: req.body.talentId || null, // Optional: associate with talent
            filename: file.filename,
            originalName: file.originalname,
            cloudinaryUrl: file.path,
            cloudinaryPublicId: file.filename,
            fileSize: file.size,
            mimeType: file.mimetype
          });
          return mediaRecord;
        })
      );

      const fileUrls = savedFiles.map(f => f.cloudinaryUrl);

      res.json({
        success: true,
        files: savedFiles.map(file => ({
          id: file.id,
          filename: file.filename,
          originalName: file.originalName,
          size: file.fileSize,
          url: file.cloudinaryUrl
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

### Step 7: Update Delete Endpoint - Remove from Both

```javascript
// DELETE /api/upload/media-kit/:id - Delete uploaded file
app.delete('/api/upload/media-kit/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ DELETE /api/upload/media-kit/:id - Deleting file:', id);
    
    // Get file from database
    const mediaFile = await mediaQueries.findById(id);
    
    if (!mediaFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(mediaFile.cloudinaryPublicId);
    
    // Delete from database
    await mediaQueries.delete(id);
    
    console.log('✅ File deleted from Cloudinary and database:', id);
    res.json({ success: true, message: 'File deleted successfully' });
    
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### Step 8: Add New Endpoints

```javascript
// GET /api/media/user/:userId - Get all media for a user
app.get('/api/media/user/:userId', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const media = await mediaQueries.findByUserId(userId);
    
    res.json({
      success: true,
      data: media,
      count: media.length
    });
  } catch (error) {
    console.error('❌ Error fetching user media:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/media/talent/:talentId - Get all media for a talent
app.get('/api/media/talent/:talentId', async (req, res) => {
  try {
    const { talentId } = req.params;
    const media = await mediaQueries.findByTalentId(talentId);
    
    res.json({
      success: true,
      data: media,
      count: media.length
    });
  } catch (error) {
    console.error('❌ Error fetching talent media:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/media/stats - Get media statistics
app.get('/api/media/stats', verifyAdmin, async (req, res) => {
  try {
    const stats = await mediaQueries.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching media stats:', error);
    res.status(500).json({ error: error.message });
  }
});
```

## Environment Variables

Add to Render dashboard:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Benefits

✅ **Persistent Storage**: Images stored on Cloudinary (never lost)  
✅ **Database Tracking**: Full record of all uploads in PostgreSQL  
✅ **User Association**: Track who uploaded what  
✅ **Audit Trail**: Timestamps and metadata  
✅ **Easy Cleanup**: Can delete orphaned files  
✅ **CDN Delivery**: Fast image loading worldwide  
✅ **No Server Storage**: No local filesystem needed  

## Migration Path

If you already have files uploaded:
1. Deploy new code with database schema
2. Old URLs will still work (if files exist)
3. New uploads automatically tracked in database
4. Optionally migrate old uploads to Cloudinary + database

## Cloudinary Free Tier

- 25 GB storage
- 25 GB bandwidth/month  
- 25 credits/month (transformations)
- Perfect for small to medium apps

Sign up: https://cloudinary.com/users/register/free

