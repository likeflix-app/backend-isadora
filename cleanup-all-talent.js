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
  console.log('  node cleanup-all-talent.js "postgresql://user:password@host:port/database" --yes');
  console.log('  OR set DATABASE_URL environment variable');
  console.log('');
  process.exit(1);
}

// Create database connection
const db = pgp({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanupAllTalent() {
  try {
    console.log('🔄 Starting cleanup of ALL talent applications...');
    console.log('🔗 Connecting to database...');
    
    // Test database connection
    await db.one('SELECT 1 as test');
    console.log('✅ Database connection successful!');
    
    // Get all talent applications (all statuses)
    const allApplications = await db.any(
      'SELECT * FROM talent_applications ORDER BY status, created_at DESC'
    );
    
    if (allApplications.length === 0) {
      console.log('✅ No talent applications found. Database is already clean!');
      await db.$pool.end();
      process.exit(0);
    }
    
    console.log(`\n📋 Found ${allApplications.length} talent application(s)`);
    
    // Group by status for display
    const byStatus = {
      pending: allApplications.filter(app => app.status === 'pending'),
      verified: allApplications.filter(app => app.status === 'verified'),
      rejected: allApplications.filter(app => app.status === 'rejected')
    };
    
    console.log('\n📊 Applications by status:');
    console.log(`   - Pending: ${byStatus.pending.length}`);
    console.log(`   - Verified: ${byStatus.verified.length}`);
    console.log(`   - Rejected: ${byStatus.rejected.length}`);
    
    console.log('\n👥 Applications to be deleted:');
    allApplications.forEach(app => {
      console.log(`   - ${app.full_name} (${app.email}) - Status: ${app.status}`);
    });
    
    // Warning prompt
    console.log('\n⚠️  WARNING: This will permanently delete ALL talent applications!');
    console.log('⚠️  This includes all pending, verified, and rejected applications.');
    console.log('⚠️  All associated media kit files will also be deleted.');
    console.log('');
    
    // Check if we're in non-interactive mode (has --yes flag)
    const hasYesFlag = process.argv.includes('--yes') || process.argv.includes('-y');
    
    if (!hasYesFlag) {
      console.log('❌ Operation cancelled. To proceed, run with --yes flag:');
      console.log(`   node cleanup-all-talent.js "${DATABASE_URL}" --yes`);
      await db.$pool.end();
      process.exit(0);
    }
    
    const uploadDir = path.join(__dirname, 'uploads', 'media-kits');
    let deletedFilesCount = 0;
    let deletedApplicationsCount = 0;
    let fileErrors = [];
    
    // Process each application
    for (const application of allApplications) {
      console.log(`\n🔍 Processing application: ${application.id} (${application.full_name}) - ${application.status}`);
      
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
              fileErrors.push({ filename, reason: 'not found' });
            }
          } catch (error) {
            console.log(`  ❌ Error deleting file from URL ${url}:`, error.message);
            fileErrors.push({ url, reason: error.message });
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
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Cleanup completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total applications deleted: ${deletedApplicationsCount}`);
    console.log(`   - Media kit files deleted: ${deletedFilesCount}`);
    if (fileErrors.length > 0) {
      console.log(`   - File errors encountered: ${fileErrors.length}`);
    }
    console.log('='.repeat(60));
    
    // Verify cleanup
    const remainingApplications = await db.oneOrNone(
      'SELECT COUNT(*) as count FROM talent_applications'
    );
    
    if (remainingApplications && parseInt(remainingApplications.count) === 0) {
      console.log('✅ Verification: All talent applications have been removed from database');
    } else {
      console.log(`⚠️ Warning: ${remainingApplications.count} application(s) still remain in database`);
    }
    
    // Close database connection
    await db.$pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    console.error('Stack trace:', error.stack);
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
cleanupAllTalent();

