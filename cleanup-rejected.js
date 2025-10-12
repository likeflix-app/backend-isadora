const fs = require('fs-extra');
const path = require('path');
const pgp = require('pg-promise')();
require('dotenv').config();

// Get database URL from command line argument or environment variable
const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: Database URL is required!');
  console.log('');
  console.log('Usage:');
  console.log('  node cleanup-rejected.js "postgresql://user:password@host:port/database"');
  console.log('  OR set DATABASE_URL environment variable');
  console.log('');
  process.exit(1);
}

// Create database connection
const db = pgp({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanupRejectedApplications() {
  try {
    console.log('🔄 Starting cleanup of rejected applications...');
    console.log('🔗 Connecting to database...');
    
    // Test database connection
    await db.one('SELECT 1 as test');
    console.log('✅ Database connection successful!');
    
    // Get all rejected applications
    const rejectedApplications = await db.any(
      'SELECT * FROM talent_applications WHERE status = $1 ORDER BY created_at DESC',
      ['rejected']
    );
    
    if (rejectedApplications.length === 0) {
      console.log('✅ No rejected applications found.');
      await db.$pool.end();
      process.exit(0);
    }
    
    console.log(`📋 Found ${rejectedApplications.length} rejected application(s)`);
    
    const uploadDir = path.join(__dirname, 'uploads', 'media-kits');
    let deletedFilesCount = 0;
    let deletedApplicationsCount = 0;
    
    // Process each rejected application
    for (const application of rejectedApplications) {
      console.log(`\n🔍 Processing application: ${application.id} (${application.full_name})`);
      
      // Parse and delete media kit files
      let mediaKitUrls = [];
      try {
        // Check if media_kit_urls is a string that needs parsing or already an array
        if (typeof application.media_kit_urls === 'string') {
          mediaKitUrls = JSON.parse(application.media_kit_urls);
        } else {
          mediaKitUrls = application.media_kit_urls || [];
        }
      } catch (error) {
        console.log('⚠️ Could not parse media kit URLs:', error.message);
      }
      
      if (mediaKitUrls.length > 0) {
        console.log(`📎 Found ${mediaKitUrls.length} media kit file(s)`);
        
        for (const url of mediaKitUrls) {
          try {
            // Extract filename from URL
            // URL format: http://domain/uploads/media-kits/filename
            const urlParts = url.split('/');
            const filename = urlParts[urlParts.length - 1];
            const filePath = path.join(uploadDir, filename);
            
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`  ✅ Deleted file: ${filename}`);
              deletedFilesCount++;
            } else {
              console.log(`  ⚠️ File not found: ${filename}`);
            }
          } catch (error) {
            console.log(`  ❌ Error deleting file from URL ${url}:`, error.message);
          }
        }
      } else {
        console.log('📎 No media kit files found for this application');
      }
      
      // Delete the application from database
      try {
        await db.none('DELETE FROM talent_applications WHERE id = $1', [application.id]);
        console.log(`✅ Deleted application: ${application.id} (${application.full_name})`);
        deletedApplicationsCount++;
      } catch (error) {
        console.log(`❌ Error deleting application ${application.id}:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Cleanup completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Applications deleted: ${deletedApplicationsCount}`);
    console.log(`   - Media kit files deleted: ${deletedFilesCount}`);
    console.log('='.repeat(50));
    
    // Close database connection
    await db.$pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    // Close database connection
    try {
      await db.$pool.end();
    } catch (e) {
      // Ignore error during cleanup
    }
    process.exit(1);
  }
}

// Run the cleanup
cleanupRejectedApplications();

