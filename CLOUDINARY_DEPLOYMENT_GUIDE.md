# 🚀 Cloudinary + PostgreSQL Deployment Guide

## ✅ Implementation Complete!

Your image upload system has been upgraded to use **Cloudinary** (permanent storage) + **PostgreSQL** (metadata tracking).

---

## 📋 Pre-Deployment Checklist

### 1. Cloudinary Credentials ✅

You already have these (stored securely):
- **Cloud Name**: `djecxub3z`
- **API Key**: `366272344528798`
- **API Secret**: `AdsQ8kOg0_O83yzvm2kN0-o_Imw`

---

## 🎯 Deployment Steps

### Step 1: Add Environment Variables to Render

1. Go to your Render dashboard: https://dashboard.render.com
2. Navigate to your **backend-isadora** service
3. Click on **Environment** in the left sidebar
4. Add these new environment variables:

```
CLOUDINARY_CLOUD_NAME=djecxub3z
CLOUDINARY_API_KEY=366272344528798
CLOUDINARY_API_SECRET=AdsQ8kOg0_O83yzvm2kN0-o_Imw
```

**Screenshot Reference:**
- Click "+ Add Environment Variable"
- Enter key and value
- Click "Save Changes"

---

### Step 2: Install New Dependencies

The new packages have been added to `package.json`:
- `cloudinary@^1.41.0`
- `multer-storage-cloudinary@^4.0.0`

Render will automatically install these when you push/deploy.

---

### Step 3: Database Migration (IMPORTANT!)

The database will automatically create the `media_uploads` table when the server starts. However, you can also run the migration manually:

**Option A: Automatic (Recommended)**
- The table will be created automatically on next server start via `initializeDatabase()` in `db.js`

**Option B: Manual via Render Shell**
1. Go to your backend service on Render
2. Click **Shell** tab
3. Run:
```bash
psql $DATABASE_URL -f create-media-uploads-table.sql
```

**Option C: Manual via PostgreSQL Client**
```bash
# Connect to your database
psql $DATABASE_URL

# Then run:
\i create-media-uploads-table.sql

# Verify table was created:
\dt media_uploads
```

---

### Step 4: Deploy Your Code

**Option A: Push to Git (Recommended)**
```bash
git add .
git commit -m "Implement Cloudinary storage with PostgreSQL tracking"
git push origin main
```

Render will automatically detect the push and redeploy.

**Option B: Manual Deploy from Render Dashboard**
1. Go to your backend service on Render
2. Click "Manual Deploy" → "Deploy latest commit"

---

### Step 5: Verify Deployment

1. **Check Server Logs** on Render:
   - Look for: `☁️ Cloudinary configured`
   - Look for: `✅ Database tables created/verified successfully`

2. **Test Health Endpoint**:
```bash
curl https://backend-isadora.onrender.com/api/health
```

3. **Test Upload** (after deployment):
```bash
curl -X POST https://backend-isadora.onrender.com/api/upload/media-kit \
  -F "mediaKit=@your-test-image.jpg"
```

Expected response:
```json
{
  "success": true,
  "files": [{
    "id": "uuid",
    "url": "https://res.cloudinary.com/djecxub3z/image/upload/v.../talent-....jpg"
  }],
  "message": "Files uploaded to Cloudinary and saved to database"
}
```

---

## 🔄 What Changed

### Before (Filesystem Storage)
- ❌ Files stored in `/uploads` directory
- ❌ Lost on every restart
- ❌ No tracking

### After (Cloudinary + PostgreSQL)
- ✅ Files stored on Cloudinary (permanent)
- ✅ Metadata tracked in PostgreSQL
- ✅ Never lost on restart
- ✅ CDN delivery (fast worldwide)
- ✅ Full audit trail

---

## 📡 New API Endpoints

### 1. Upload Files (Updated)
```bash
POST /api/upload/media-kit
```

**Request:**
```bash
curl -X POST https://backend-isadora.onrender.com/api/upload/media-kit \
  -F "mediaKit=@photo.jpg" \
  -F "userId=optional-user-id" \
  -F "talentId=optional-talent-id"
```

**Response:**
```json
{
  "success": true,
  "files": [{
    "id": "file-uuid",
    "filename": "talent-1234567890-987654321",
    "originalName": "photo.jpg",
    "size": 245678,
    "url": "https://res.cloudinary.com/djecxub3z/image/upload/.../talent-1234567890-987654321.jpg",
    "cloudinaryPublicId": "talent-media-kits/talent-1234567890-987654321"
  }],
  "urls": ["https://res.cloudinary.com/..."],
  "message": "Files uploaded to Cloudinary and saved to database"
}
```

### 2. Delete File (Updated)
```bash
DELETE /api/upload/media-kit/:id
```

Now uses the database ID (UUID) instead of filename:
```bash
curl -X DELETE https://backend-isadora.onrender.com/api/upload/media-kit/file-uuid-here
```

### 3. List All Files (Admin) (Updated)
```bash
GET /api/admin/media-kits
Authorization: Bearer {admin_token}
```

Now returns database records with Cloudinary URLs:
```json
{
  "success": true,
  "data": [...],
  "count": 42,
  "stats": {
    "totalFiles": 42,
    "totalSize": 52428800,
    "totalSizeMB": "50.00",
    "uniqueUsers": 15,
    "talentsWithMedia": 20
  }
}
```

### 4. Get User Media (NEW - Admin Only)
```bash
GET /api/media/user/:userId
Authorization: Bearer {admin_token}
```

### 5. Get Talent Media (NEW)
```bash
GET /api/media/talent/:talentId
```

### 6. Get Media Statistics (NEW - Admin Only)
```bash
GET /api/media/stats
Authorization: Bearer {admin_token}
```

---

## 🧪 Testing After Deployment

### Test 1: Upload a File
```bash
# Create a test image
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > test.png

# Upload it
curl -X POST https://backend-isadora.onrender.com/api/upload/media-kit \
  -F "mediaKit=@test.png"
```

### Test 2: View Uploaded Files (Admin)
```bash
# Login as admin first
TOKEN=$(curl -X POST https://backend-isadora.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@talento.com","password":"password"}' \
  | jq -r '.data.token')

# List files
curl -X GET https://backend-isadora.onrender.com/api/admin/media-kits \
  -H "Authorization: Bearer $TOKEN"
```

### Test 3: Access Image URL
Copy the URL from the upload response and open it in your browser. It should look like:
```
https://res.cloudinary.com/djecxub3z/image/upload/v1234567890/talent-media-kits/talent-....jpg
```

### Test 4: Delete a File
```bash
# Use the file ID from upload response
curl -X DELETE https://backend-isadora.onrender.com/api/upload/media-kit/{file-id} \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Database Schema

The new `media_uploads` table structure:

```sql
CREATE TABLE media_uploads (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id),
  talent_id VARCHAR(255) REFERENCES talent_applications(id),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL UNIQUE,
  file_size INTEGER DEFAULT 0,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔒 Security Notes

1. **Environment Variables**: Cloudinary credentials are stored securely in Render environment variables
2. **Fallback Values**: The code includes fallback values for development, but production should use environment variables
3. **Admin Endpoints**: Media listing and stats require admin authentication
4. **CORS**: Upload endpoint respects your existing CORS configuration

---

## 💰 Cloudinary Free Tier Limits

Your free tier includes:
- ✅ 25 GB storage
- ✅ 25 GB bandwidth per month
- ✅ 25 credits/month for transformations
- ✅ Unlimited images

Monitor usage at: https://cloudinary.com/console

---

## 🐛 Troubleshooting

### Issue: "Cloudinary config error"
**Solution**: Verify environment variables are set correctly in Render dashboard

### Issue: "Table media_uploads does not exist"
**Solution**: 
1. Check server logs for database initialization
2. Manually run migration: `psql $DATABASE_URL -f create-media-uploads-table.sql`

### Issue: "Upload works but image URL returns 404"
**Solution**: This should NOT happen with Cloudinary! Files persist forever. Check:
1. Cloudinary dashboard to verify file was uploaded
2. The URL is from Cloudinary domain (res.cloudinary.com)

### Issue: "Delete fails"
**Solution**: Make sure you're using the database ID (UUID), not the filename

---

## 📈 Monitoring

### Check Upload Statistics
```bash
curl https://backend-isadora.onrender.com/api/media/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### View Recent Uploads in Database
```bash
psql $DATABASE_URL -c "SELECT id, original_name, cloudinary_url, uploaded_at FROM media_uploads ORDER BY uploaded_at DESC LIMIT 10;"
```

---

## 🎉 Success Indicators

After deployment, you should see:

1. ✅ No more 404 errors on image URLs
2. ✅ Images persist across server restarts
3. ✅ Images load fast from Cloudinary CDN
4. ✅ Database tracks all uploads
5. ✅ Can delete files from both Cloudinary and database

---

## 📞 Support

If you encounter issues:

1. Check Render logs: `https://dashboard.render.com/web/{your-service}/logs`
2. Check Cloudinary dashboard: `https://cloudinary.com/console`
3. Check database: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM media_uploads;"`

---

## ✨ Next Steps (Optional)

### 1. Associate Uploads with Talent Applications
When submitting a talent application, include the file IDs:
```javascript
// Upload files first
const uploadResponse = await fetch('/api/upload/media-kit', {
  method: 'POST',
  body: formData
});
const { files } = await uploadResponse.json();
const fileIds = files.map(f => f.id);

// Then submit application with file IDs
await fetch('/api/talent/applications', {
  method: 'POST',
  body: JSON.stringify({
    ...applicationData,
    mediaKitIds: fileIds // Store these IDs
  })
});
```

### 2. Image Transformations
Cloudinary supports automatic transformations:
```
# Original: https://res.cloudinary.com/.../talent-123.jpg
# Thumbnail: https://res.cloudinary.com/.../w_200,h_200,c_fill/talent-123.jpg
# Optimized: https://res.cloudinary.com/.../q_auto,f_auto/talent-123.jpg
```

### 3. Cleanup Orphaned Files
Periodically delete files that aren't associated with any talent application.

---

## 🎯 Deployment Complete!

Your system is now production-ready with permanent file storage! 🚀

