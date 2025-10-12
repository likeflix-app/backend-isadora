# 📊 Upload Flow Diagram

## 🔄 Complete Upload & Display Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                                                                  │
│  1. User selects files                                          │
│     ┌─────────────────┐                                        │
│     │ <input type=    │                                        │
│     │  "file"         │                                        │
│     │  multiple />    │                                        │
│     └─────────────────┘                                        │
│            │                                                     │
│            ▼                                                     │
│  2. Create FormData                                             │
│     ┌─────────────────────────────────────┐                   │
│     │ formData.append('mediaKit', file1)  │                   │
│     │ formData.append('mediaKit', file2)  │                   │
│     │ formData.append('userId', 'uuid')   │                   │
│     └─────────────────────────────────────┘                   │
│            │                                                     │
│            ▼                                                     │
│  3. POST Request                                                │
│     ┌─────────────────────────────────────┐                   │
│     │ fetch('/api/upload/media-kit', {    │                   │
│     │   method: 'POST',                   │                   │
│     │   body: formData                    │                   │
│     │ })                                  │                   │
│     └─────────────────────────────────────┘                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ HTTP POST
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (server.js)                         │
│                                                                  │
│  4. Multer receives files                                       │
│     ┌─────────────────────────────────────┐                   │
│     │ upload.array('mediaKit', 10)        │                   │
│     └─────────────────────────────────────┘                   │
│            │                                                     │
│            ▼                                                     │
│  5. Multer-Storage-Cloudinary uploads to Cloudinary            │
│     ┌─────────────────────────────────────┐                   │
│     │ CloudinaryStorage({                 │                   │
│     │   folder: 'talent-media-kits'       │                   │
│     │ })                                  │                   │
│     └─────────────────────────────────────┘                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ Upload files
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDINARY                                │
│                                                                  │
│  6. Files stored permanently                                    │
│     ┌─────────────────────────────────────┐                   │
│     │  talent-media-kits/                 │                   │
│     │    ├─ talent-12345.jpg              │                   │
│     │    ├─ talent-67890.jpg              │                   │
│     │    └─ talent-11111.pdf              │                   │
│     └─────────────────────────────────────┘                   │
│            │                                                     │
│            │ Returns Cloudinary URLs                            │
│            │                                                     │
└────────────┼─────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (server.js)                            │
│                                                                  │
│  7. Save metadata to database                                   │
│     ┌─────────────────────────────────────┐                   │
│     │ mediaQueries.create({               │                   │
│     │   id: uuid(),                       │                   │
│     │   cloudinaryUrl: file.path,         │                   │
│     │   cloudinaryPublicId: file.filename │                   │
│     │   userId: '...',                    │                   │
│     │   size: file.size                   │                   │
│     │ })                                  │                   │
│     └─────────────────────────────────────┘                   │
│            │                                                     │
└────────────┼─────────────────────────────────────────────────────┘
             │
             │ SQL INSERT
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE                            │
│                                                                  │
│  8. Record saved in media_uploads table                         │
│     ┌────────────────────────────────────────────────┐        │
│     │ id                    │ uuid-123                │        │
│     │ filename              │ talent-12345            │        │
│     │ cloudinary_url        │ https://res.cloudina... │        │
│     │ cloudinary_public_id  │ talent-media-kits/...   │        │
│     │ user_id               │ user-uuid               │        │
│     │ file_size             │ 245678                  │        │
│     │ created_at            │ 2025-10-12 10:30:00     │        │
│     └────────────────────────────────────────────────┘        │
│                                                                  │
└────────────┬─────────────────────────────────────────────────────┘
             │
             │ Success
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (server.js)                            │
│                                                                  │
│  9. Return response to frontend                                 │
│     ┌─────────────────────────────────────┐                   │
│     │ res.json({                          │                   │
│     │   success: true,                    │                   │
│     │   files: [{                         │                   │
│     │     id: 'uuid-123',                 │                   │
│     │     url: 'https://res.cloudinary...'│                   │
│     │   }]                                │                   │
│     │ })                                  │                   │
│     └─────────────────────────────────────┘                   │
└────────────┬─────────────────────────────────────────────────────┘
             │
             │ JSON Response
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                                                                  │
│  10. Display images from Cloudinary CDN                         │
│      ┌─────────────────────────────────────┐                  │
│      │ <img src={file.url} />              │                  │
│      │                                     │                  │
│      │ https://res.cloudinary.com/         │                  │
│      │   djecxub3z/image/upload/...        │                  │
│      └─────────────────────────────────────┘                  │
│                                                                  │
│  ✅ Image displays immediately                                  │
│  ✅ Image persists forever (no 404)                            │
│  ✅ Fast loading via CDN                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Data Flow Comparison

### OLD SYSTEM (Broken) ❌

```
Frontend → Backend → Local /uploads folder → Backend serves file
                                  ↓
                              Render restarts
                                  ↓
                              Files DELETED
                                  ↓
                              URLs return 404 ❌
```

### NEW SYSTEM (Working) ✅

```
Frontend → Backend → Cloudinary (permanent) → Database tracks metadata
              ↓                    ↓
         Returns URL          URL saved
              ↓                    ↓
         Frontend        Backend can restart
              ↓                    ↓
     Display image            Files still exist
              ↓                    ↓
        Works forever ✅     No 404 errors ✅
```

---

## 🗂️ Database Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    media_uploads TABLE                       │
├─────────────────────────┬───────────────────────────────────┤
│ COLUMN                  │ EXAMPLE VALUE                     │
├─────────────────────────┼───────────────────────────────────┤
│ id (PK)                 │ a1b2c3d4-e5f6-7890-abcd-ef12...  │
│ user_id (FK)            │ user-uuid-here                    │
│ talent_id (FK)          │ talent-uuid-here                  │
│ filename                │ talent-1728567890-987654321       │
│ original_name           │ my-photo.jpg                      │
│ cloudinary_url          │ https://res.cloudinary.com/...    │
│ cloudinary_public_id    │ talent-media-kits/talent-172...   │
│ file_size               │ 245678                            │
│ mime_type               │ image/jpeg                        │
│ uploaded_at             │ 2025-10-12 10:30:00               │
│ created_at              │ 2025-10-12 10:30:00               │
└─────────────────────────┴───────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                talent_applications TABLE                     │
├─────────────────────────┬───────────────────────────────────┤
│ id (PK)                 │ talent-uuid-here                  │
│ full_name               │ Jane Doe                          │
│ media_kit_urls (JSONB)  │ [                                 │
│                         │   "https://res.cloudinary.com/...",│
│                         │   "https://res.cloudinary.com/..." │
│                         │ ]                                 │
│ ...                     │ ...                               │
└─────────────────────────┴───────────────────────────────────┘
```

---

## 🔄 Delete Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                                                              │
│  1. User clicks Delete button                               │
│     file.id = "a1b2c3d4-e5f6-7890..."                      │
│            │                                                 │
│            ▼                                                 │
│  2. DELETE request with file ID                             │
│     DELETE /api/upload/media-kit/a1b2c3d4-...              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (server.js)                        │
│                                                              │
│  3. Find file in database                                   │
│     mediaQueries.findById(id)                               │
│            │                                                 │
│            ▼                                                 │
│  4. Delete from Cloudinary                                  │
│     cloudinary.uploader.destroy(publicId)                   │
│            │                                                 │
│            ▼                                                 │
│  5. Delete from database                                    │
│     mediaQueries.delete(id)                                 │
│            │                                                 │
│            ▼                                                 │
│  6. Return success                                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                                                              │
│  7. Remove from UI                                          │
│     setFiles(files.filter(f => f.id !== deletedId))        │
│                                                              │
│  ✅ File deleted from both Cloudinary and database          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Points

### Upload
1. Frontend sends files to backend
2. Backend uploads to Cloudinary (permanent storage)
3. Backend saves metadata to PostgreSQL
4. Backend returns Cloudinary URLs to frontend
5. Frontend displays images using Cloudinary URLs

### Display
1. Frontend fetches talent data from backend
2. Backend returns data with Cloudinary URLs in `mediaKitUrls`
3. Frontend displays images directly from Cloudinary CDN
4. No proxying through backend needed

### Delete
1. Frontend sends file ID (not filename!) to backend
2. Backend deletes from both Cloudinary and database
3. Backend confirms deletion
4. Frontend removes from UI

---

## 📊 Response Structure Flow

```
UPLOAD RESPONSE
┌─────────────────────────────────────┐
│ {                                   │
│   success: true,                    │
│   files: [                          │
│     {                               │
│       id: "uuid" ────────────────┐  │  Use for DELETE
│       url: "https://..." ────────┼──┼─ Use for <img src>
│       originalName: "photo.jpg"  │  │
│       size: 123456               │  │
│     }                            │  │
│   ],                             │  │
│   urls: ["https://..."] ─────────┼──┘  Quick access
│ }                                │
└──────────────────────────────────┘

TALENT RESPONSE
┌─────────────────────────────────────┐
│ {                                   │
│   success: true,                    │
│   data: [                           │
│     {                               │
│       id: "talent-uuid",            │
│       fullName: "Jane Doe",         │
│       mediaKitUrls: [ ──────────────┼─ Array of Cloudinary URLs
│         "https://res.cloudinary...", │  Use in <img src={url}>
│         "https://res.cloudinary..."  │
│       ]                             │
│     }                               │
│   ]                                 │
│ }                                   │
└─────────────────────────────────────┘
```

---

## ✅ Success Criteria

After implementation, your frontend should:

- ✅ Upload files successfully
- ✅ Receive Cloudinary URLs (starts with `https://res.cloudinary.com/`)
- ✅ Display images from Cloudinary CDN
- ✅ Images load fast (global CDN)
- ✅ Images never return 404
- ✅ Images persist after backend restarts
- ✅ Can delete files using database IDs
- ✅ Handle errors gracefully

---

## 🚀 Ready to Implement!

Use the code examples in:
- **FRONTEND_QUICK_START.md** - Quick copy-paste code
- **FRONTEND_INTEGRATION.md** - Complete examples and best practices

Your images will now work forever! 🎉

