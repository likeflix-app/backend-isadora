const pgp = require('pg-promise')();
require('dotenv').config();

// Database connection configuration
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

const db = pgp(connectionConfig);

// Initialize database tables
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Create users table
    await db.none(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        mobile VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        email_verified BOOLEAN DEFAULT true,
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP
      )
    `);
    
    // Add password reset columns if they don't exist (migration for existing databases)
    await db.none(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)
    `);
    
    await db.none(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `);
    
    // Create talent_applications table
    await db.none(`
      CREATE TABLE IF NOT EXISTS talent_applications (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        
        -- Personal Information
        full_name VARCHAR(255) NOT NULL,
        birth_year INTEGER NOT NULL,
        city VARCHAR(255) NOT NULL,
        nickname VARCHAR(255),
        phone VARCHAR(50) NOT NULL,
        bio TEXT,
        
        -- Profile Information
        social_channels JSONB DEFAULT '[]',
        social_links TEXT,
        media_kit_urls JSONB DEFAULT '[]',
        content_categories JSONB DEFAULT '[]',
        
        -- Availability Information
        available_for_products VARCHAR(50) DEFAULT 'No',
        shipping_address TEXT,
        available_for_reels VARCHAR(50) DEFAULT 'No',
        available_next_3_months VARCHAR(50) DEFAULT 'No',
        availability_period TEXT,
        
        -- Experience
        collaborated_agencies VARCHAR(50) DEFAULT 'No',
        agencies_list TEXT,
        collaborated_brands VARCHAR(50) DEFAULT 'No',
        brands_list TEXT,
        
        -- Fiscal Information
        has_vat VARCHAR(50) DEFAULT 'No',
        payment_methods JSONB DEFAULT '[]',
        
        -- Terms
        terms_accepted BOOLEAN DEFAULT false,
        
        -- Celebrity & Analytics
        is_celebrity BOOLEAN DEFAULT false,
        click_count INTEGER DEFAULT 0,
        
        -- System Information
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by VARCHAR(255),
        review_notes TEXT
      )
    `);
    
    // Add celebrity and click_count columns if they don't exist (migration for existing databases)
    await db.none(`
      ALTER TABLE talent_applications 
      ADD COLUMN IF NOT EXISTS is_celebrity BOOLEAN DEFAULT false
    `);
    
    await db.none(`
      ALTER TABLE talent_applications 
      ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0
    `);
    
    // Add price field (admin only, stores € symbols like "€€€")
    await db.none(`
      ALTER TABLE talent_applications 
      ADD COLUMN IF NOT EXISTS price VARCHAR(10) DEFAULT ''
    `);
    
    // Create media_uploads table
    await db.none(`
      CREATE TABLE IF NOT EXISTS media_uploads (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        talent_id VARCHAR(255) REFERENCES talent_applications(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        cloudinary_url TEXT NOT NULL,
        cloudinary_public_id VARCHAR(255) NOT NULL UNIQUE,
        file_size INTEGER DEFAULT 0,
        mime_type VARCHAR(100),
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create bookings table
    await db.none(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(255),
        time_slot_date VARCHAR(255) NOT NULL,
        time_slot_time VARCHAR(255) NOT NULL,
        time_slot_datetime TIMESTAMP NOT NULL,
        talents JSONB NOT NULL,
        price_range VARCHAR(50) NOT NULL,
        user_idea TEXT,
        status VARCHAR(50) DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes for better performance
    await db.none('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await db.none('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    await db.none('CREATE INDEX IF NOT EXISTS idx_talent_applications_user_id ON talent_applications(user_id)');
    await db.none('CREATE INDEX IF NOT EXISTS idx_talent_applications_status ON talent_applications(status)');
    await db.none('CREATE INDEX IF NOT EXISTS idx_media_user ON media_uploads(user_id)');
    await db.none('CREATE INDEX IF NOT EXISTS idx_media_talent ON media_uploads(talent_id)');
    await db.none('CREATE INDEX IF NOT EXISTS idx_media_cloudinary_id ON media_uploads(cloudinary_public_id)');
    await db.none('CREATE INDEX IF NOT EXISTS idx_media_created_at ON media_uploads(created_at)');
    await db.none('CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)');
    await db.none('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)');
    await db.none('CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at)');
    
    console.log('✅ Database tables created/verified successfully');
    
    // Check if demo users exist, if not create them
    await seedDemoUsers();
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Seed demo users if they don't exist
async function seedDemoUsers() {
  try {
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    
    // Check if demo users exist
    const existingUsers = await db.any('SELECT id FROM users LIMIT 1');
    
    if (existingUsers.length === 0) {
      console.log('📝 Seeding demo users...');
      
      const hashedPassword = await bcrypt.hash('password', 10);
      
      const demoUsers = [
        {
          id: uuidv4(),
          email: 'demo@example.com',
          name: 'Demo User',
          password: hashedPassword,
          role: 'user',
          email_verified: true
        },
        {
          id: uuidv4(),
          email: 'admin@talento.com',
          name: 'Admin User',
          password: hashedPassword,
          role: 'admin',
          email_verified: true
        }
      ];
      
      for (const user of demoUsers) {
        await db.none(
          'INSERT INTO users(id, email, name, password, role, email_verified) VALUES($1, $2, $3, $4, $5, $6)',
          [user.id, user.email, user.name, user.password, user.role, user.email_verified]
        );
      }
      
      console.log('✅ Demo users created successfully');
      console.log('   📧 demo@example.com / password: password');
      console.log('   📧 admin@talento.com / password: password');
    }
  } catch (error) {
    console.error('⚠️ Error seeding demo users:', error.message);
  }
}

// Database helper functions for users
const userQueries = {
  // Find user by email
  findByEmail: async (email) => {
    return await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
  },
  
  // Find user by ID
  findById: async (id) => {
    return await db.oneOrNone('SELECT * FROM users WHERE id = $1', [id]);
  },
  
  // Get all verified users
  getAllVerified: async () => {
    return await db.any('SELECT * FROM users WHERE email_verified = true ORDER BY created_at DESC');
  },
  
  // Create new user
  create: async (userData) => {
    const { id, email, name, password, role, mobile, emailVerified } = userData;
    return await db.one(
      `INSERT INTO users(id, email, name, password, role, mobile, email_verified, created_at, updated_at)
       VALUES($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [id, email, name, password || null, role || 'user', mobile || '', emailVerified !== false]
    );
  },
  
  // Update user
  update: async (id, updates) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${paramIndex}`);
      values.push(updates[key]);
      paramIndex++;
    });
    
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    return await db.one(query, values);
  },
  
  // Update user role
  updateRole: async (id, role) => {
    return await db.one(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [role, id]
    );
  },
  
  // Delete user
  delete: async (id) => {
    await db.none('DELETE FROM users WHERE id = $1', [id]);
    return { deleted: true, userId: id };
  },
  
  // Get user statistics
  getStats: async () => {
    const stats = await db.one(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users
      FROM users
    `);
    return {
      totalUsers: parseInt(stats.total_users),
      verifiedUsers: parseInt(stats.verified_users),
      adminUsers: parseInt(stats.admin_users),
      regularUsers: parseInt(stats.regular_users)
    };
  },
  
  // Save password reset token
  saveResetToken: async (email, resetToken, expiryDate) => {
    return await db.one(
      `UPDATE users 
       SET reset_token = $1, reset_token_expiry = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE email = $3 
       RETURNING id, email, name`,
      [resetToken, expiryDate, email]
    );
  },
  
  // Find user by reset token
  findByResetToken: async (resetToken) => {
    return await db.oneOrNone(
      `SELECT * FROM users 
       WHERE reset_token = $1 AND reset_token_expiry > CURRENT_TIMESTAMP`,
      [resetToken]
    );
  },
  
  // Clear reset token
  clearResetToken: async (userId) => {
    return await db.one(
      `UPDATE users 
       SET reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [userId]
    );
  },
  
  // Update password
  updatePassword: async (userId, hashedPassword) => {
    return await db.one(
      `UPDATE users 
       SET password = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [hashedPassword, userId]
    );
  }
};

// Database helper functions for talent applications
const talentQueries = {
  // Create new application
  create: async (applicationData) => {
    const {
      id, userId, email, status,
      fullName, birthYear, city, nickname, phone, bio,
      socialChannels, socialLinks, mediaKitUrls, contentCategories,
      availableForProducts, shippingAddress, availableForReels, availableNext3Months, availabilityPeriod,
      collaboratedAgencies, agenciesList, collaboratedBrands, brandsList,
      hasVAT, paymentMethods,
      termsAccepted
    } = applicationData;
    
    console.log('🗄️ Database create - mediaKitUrls received:', mediaKitUrls);
    console.log('🗄️ Database create - mediaKitUrls type:', typeof mediaKitUrls);
    console.log('🗄️ Database create - mediaKitUrls JSON:', JSON.stringify(mediaKitUrls));
    
    return await db.one(
      `INSERT INTO talent_applications(
        id, user_id, email, status,
        full_name, birth_year, city, nickname, phone, bio,
        social_channels, social_links, media_kit_urls, content_categories,
        available_for_products, shipping_address, available_for_reels, available_next_3_months, availability_period,
        collaborated_agencies, agencies_list, collaborated_brands, brands_list,
        has_vat, payment_methods,
        terms_accepted,
        created_at, updated_at
      ) VALUES(
        $1, $2, $3, $4,
        $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22, $23,
        $24, $25,
        $26,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        id, userId, email, status || 'pending',
        fullName, birthYear, city, nickname || '', phone, bio || '',
        JSON.stringify(socialChannels || []), socialLinks || '', JSON.stringify(mediaKitUrls || []), JSON.stringify(contentCategories || []),
        availableForProducts || 'No', shippingAddress || '', availableForReels || 'No', availableNext3Months || 'No', availabilityPeriod || '',
        collaboratedAgencies || 'No', agenciesList || '', collaboratedBrands || 'No', brandsList || '',
        hasVAT || 'No', JSON.stringify(paymentMethods || []),
        termsAccepted === true
      ]
    );
  },
  
  // Get all applications
  getAll: async (statusFilter = null) => {
    if (statusFilter) {
      return await db.any(
        'SELECT * FROM talent_applications WHERE status = $1 ORDER BY created_at DESC',
        [statusFilter]
      );
    }
    return await db.any('SELECT * FROM talent_applications ORDER BY created_at DESC');
  },
  
  // Find application by ID
  findById: async (id) => {
    return await db.oneOrNone('SELECT * FROM talent_applications WHERE id = $1', [id]);
  },
  
  // Find application by user ID
  findByUserId: async (userId) => {
    return await db.oneOrNone('SELECT * FROM talent_applications WHERE user_id = $1', [userId]);
  },
  
  // Check if user has pending or verified application
  findActiveByUserId: async (userId) => {
    return await db.oneOrNone(
      "SELECT * FROM talent_applications WHERE user_id = $1 AND status IN ('pending', 'verified')",
      [userId]
    );
  },
  
  // Update application
  update: async (id, updates) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    // Map camelCase to snake_case for database fields
    const fieldMapping = {
      city: 'city',
      phone: 'phone',
      bio: 'bio',
      socialChannels: 'social_channels',
      socialLinks: 'social_links',
      mediaKitUrls: 'media_kit_urls',
      contentCategories: 'content_categories',
      availableForProducts: 'available_for_products',
      shippingAddress: 'shipping_address',
      availableForReels: 'available_for_reels',
      availableNext3Months: 'available_next_3_months',
      availabilityPeriod: 'availability_period',
      hasVAT: 'has_vat',
      paymentMethods: 'payment_methods',
      price: 'price'
    };
    
    Object.keys(updates).forEach(key => {
      const dbField = fieldMapping[key];
      if (dbField) {
        let value = updates[key];
        
        // Convert arrays to JSON strings for JSONB fields
        if (['socialChannels', 'mediaKitUrls', 'contentCategories', 'paymentMethods'].includes(key)) {
          value = JSON.stringify(value);
        }
        
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Always update the updated_at timestamp
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `UPDATE talent_applications SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    return await db.one(query, values);
  },
  
  // Update application status
  updateStatus: async (id, status, reviewedBy, reviewNotes) => {
    return await db.one(
      `UPDATE talent_applications 
       SET status = $1, reviewed_by = $2, review_notes = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [status, reviewedBy, reviewNotes || '', id]
    );
  },
  
  // Delete application
  delete: async (id) => {
    const app = await db.oneOrNone('SELECT id, full_name, status FROM talent_applications WHERE id = $1', [id]);
    if (!app) return null;
    
    await db.none('DELETE FROM talent_applications WHERE id = $1', [id]);
    return app;
  },
  
  // Get statistics
  getStats: async () => {
    const stats = await db.one(`
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
      FROM talent_applications
    `);
    
    const recentApplications = await db.any(`
      SELECT id, full_name, status, created_at
      FROM talent_applications
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    return {
      totalApplications: parseInt(stats.total_applications),
      pending: parseInt(stats.pending),
      verified: parseInt(stats.verified),
      rejected: parseInt(stats.rejected),
      recentApplications
    };
  },
  
  // Toggle celebrity status
  toggleCelebrityStatus: async (id, isCelebrity) => {
    return await db.one(
      `UPDATE talent_applications 
       SET is_celebrity = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [isCelebrity, id]
    );
  },
  
  // Track click
  trackClick: async (id) => {
    return await db.one(
      `UPDATE talent_applications 
       SET click_count = click_count + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id]
    );
  }
};

// Database helper functions for media uploads
const mediaQueries = {
  // Create new media upload record
  create: async (mediaData) => {
    const {
      id, userId, talentId, filename, originalName,
      cloudinaryUrl, cloudinaryPublicId, fileSize, mimeType
    } = mediaData;
    
    return await db.one(
      `INSERT INTO media_uploads(
        id, user_id, talent_id, filename, original_name,
        cloudinary_url, cloudinary_public_id, file_size, mime_type,
        uploaded_at, created_at
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [id, userId || null, talentId || null, filename, originalName, cloudinaryUrl, cloudinaryPublicId, fileSize || 0, mimeType || 'unknown']
    );
  },
  
  // Find media by ID
  findById: async (id) => {
    return await db.oneOrNone('SELECT * FROM media_uploads WHERE id = $1', [id]);
  },
  
  // Find media by Cloudinary public ID
  findByCloudinaryId: async (cloudinaryPublicId) => {
    return await db.oneOrNone('SELECT * FROM media_uploads WHERE cloudinary_public_id = $1', [cloudinaryPublicId]);
  },
  
  // Find all media by talent ID
  findByTalentId: async (talentId) => {
    return await db.any(
      'SELECT * FROM media_uploads WHERE talent_id = $1 ORDER BY created_at DESC',
      [talentId]
    );
  },
  
  // Find all media by user ID
  findByUserId: async (userId) => {
    return await db.any(
      'SELECT * FROM media_uploads WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
  },
  
  // Get all media (with optional limit)
  getAll: async (limit = 100) => {
    return await db.any(
      'SELECT * FROM media_uploads ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
  },
  
  // Delete media by ID
  delete: async (id) => {
    const media = await db.oneOrNone('SELECT * FROM media_uploads WHERE id = $1', [id]);
    if (!media) return null;
    
    await db.none('DELETE FROM media_uploads WHERE id = $1', [id]);
    return media;
  },
  
  // Delete media by Cloudinary public ID
  deleteByCloudinaryId: async (cloudinaryPublicId) => {
    const media = await db.oneOrNone('SELECT * FROM media_uploads WHERE cloudinary_public_id = $1', [cloudinaryPublicId]);
    if (!media) return null;
    
    await db.none('DELETE FROM media_uploads WHERE cloudinary_public_id = $1', [cloudinaryPublicId]);
    return media;
  },
  
  // Get media statistics
  getStats: async () => {
    const stats = await db.one(`
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT talent_id) as talents_with_media
      FROM media_uploads
    `);
    
    return {
      totalFiles: parseInt(stats.total_files),
      totalSize: parseInt(stats.total_size || 0),
      uniqueUsers: parseInt(stats.unique_users || 0),
      talentsWithMedia: parseInt(stats.talents_with_media || 0)
    };
  }
};

// Database helper functions for bookings
const bookingQueries = {
  // Create new booking
  create: async (bookingData) => {
    const {
      id, userId, userEmail, userName, phoneNumber,
      timeSlotDate, timeSlotTime, timeSlotDatetime,
      talents, priceRange, userIdea, status
    } = bookingData;
    
    console.log('🗄️ Database create - Creating booking:', id);
    
    return await db.one(
      `INSERT INTO bookings(
        id, user_id, user_email, user_name, phone_number,
        time_slot_date, time_slot_time, time_slot_datetime,
        talents, price_range, user_idea, status,
        created_at, updated_at
      ) VALUES(
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10, $11, $12,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        id, userId, userEmail, userName, phoneNumber || null,
        timeSlotDate, timeSlotTime, timeSlotDatetime,
        JSON.stringify(talents), priceRange, userIdea || null, status || 'confirmed'
      ]
    );
  },
  
  // Get all bookings
  getAll: async (statusFilter = null) => {
    if (statusFilter) {
      return await db.any(
        'SELECT * FROM bookings WHERE status = $1 ORDER BY created_at DESC',
        [statusFilter]
      );
    }
    return await db.any('SELECT * FROM bookings ORDER BY created_at DESC');
  },
  
  // Find booking by ID
  findById: async (id) => {
    return await db.oneOrNone('SELECT * FROM bookings WHERE id = $1', [id]);
  },
  
  // Find bookings by user ID
  findByUserId: async (userId) => {
    return await db.any(
      'SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
  },
  
  // Update booking status
  updateStatus: async (id, status) => {
    return await db.one(
      `UPDATE bookings 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [status, id]
    );
  },
  
  // Update booking
  update: async (id, updates) => {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    // Map camelCase to snake_case for database fields
    const fieldMapping = {
      phoneNumber: 'phone_number',
      timeSlotDate: 'time_slot_date',
      timeSlotTime: 'time_slot_time',
      timeSlotDatetime: 'time_slot_datetime',
      talents: 'talents',
      priceRange: 'price_range',
      userIdea: 'user_idea',
      status: 'status'
    };
    
    Object.keys(updates).forEach(key => {
      const dbField = fieldMapping[key];
      if (dbField) {
        let value = updates[key];
        
        // Convert talents array to JSON string for JSONB field
        if (key === 'talents') {
          value = JSON.stringify(value);
        }
        
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Always update the updated_at timestamp
    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const query = `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    return await db.one(query, values);
  },
  
  // Delete booking
  delete: async (id) => {
    const booking = await db.oneOrNone('SELECT * FROM bookings WHERE id = $1', [id]);
    if (!booking) return null;
    
    await db.none('DELETE FROM bookings WHERE id = $1', [id]);
    return booking;
  },
  
  // Get statistics
  getStats: async () => {
    const stats = await db.one(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
      FROM bookings
    `);
    
    return {
      totalBookings: parseInt(stats.total_bookings),
      pending: parseInt(stats.pending),
      confirmed: parseInt(stats.confirmed),
      completed: parseInt(stats.completed),
      cancelled: parseInt(stats.cancelled)
    };
  }
};

// Helper to convert snake_case to camelCase for API responses
function toCamelCase(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  const camelObj = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Debug logging for media_kit_urls
    if (key === 'media_kit_urls') {
      console.log('🔄 toCamelCase - media_kit_urls key found:', key);
      console.log('🔄 toCamelCase - media_kit_urls value:', obj[key]);
      console.log('🔄 toCamelCase - media_kit_urls type:', typeof obj[key]);
    }
    
    // Parse JSON fields
    if (typeof obj[key] === 'string' && (key.includes('channels') || key.includes('urls') || key.includes('categories') || key.includes('methods'))) {
      try {
        const parsed = JSON.parse(obj[key]);
        console.log('🔄 toCamelCase - Parsed JSON for', key, ':', parsed);
        camelObj[camelKey] = parsed;
      } catch (error) {
        console.log('🔄 toCamelCase - JSON parse failed for', key, ':', error.message);
        camelObj[camelKey] = obj[key];
      }
    } else {
      camelObj[camelKey] = obj[key];
    }
  }
  return camelObj;
}

module.exports = {
  db,
  initializeDatabase,
  userQueries,
  talentQueries,
  mediaQueries,
  bookingQueries,
  toCamelCase
};

