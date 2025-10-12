-- Migration: Create media_uploads table for tracking file uploads
-- This table stores metadata about files uploaded to Cloudinary

CREATE TABLE IF NOT EXISTS media_uploads (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  talent_id UUID REFERENCES talent_applications(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  cloudinary_url TEXT NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL UNIQUE,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_media_user ON media_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_media_talent ON media_uploads(talent_id);
CREATE INDEX IF NOT EXISTS idx_media_cloudinary_id ON media_uploads(cloudinary_public_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media_uploads(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE media_uploads IS 'Stores metadata for files uploaded to Cloudinary';
COMMENT ON COLUMN media_uploads.user_id IS 'User who uploaded the file (nullable if user deleted)';
COMMENT ON COLUMN media_uploads.talent_id IS 'Associated talent application (cascade delete)';
COMMENT ON COLUMN media_uploads.cloudinary_public_id IS 'Cloudinary public ID for deletion';
COMMENT ON COLUMN media_uploads.cloudinary_url IS 'Full Cloudinary URL for accessing the file';

-- Verify table was created
SELECT 'media_uploads table created successfully!' as status;

