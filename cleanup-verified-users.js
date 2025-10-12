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
  console.log('  node cleanup-verified-users.js "postgresql://user:password@host:port/database"');
  console.log('  OR set DATABASE_URL environment variable');
  console.log('');
  process.exit(1);
}

// Create database connection
const db = pgp({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanupVerifiedUsers() {
  try {
    console.log('🔄 Starting cleanup of verified users...');
    console.log('🔗 Connecting to database...');
    
    // Test database connection
    await db.one('SELECT 1 as test');
    console.log('✅ Database connection successful!');
    
    // Get all verified users EXCEPT admins
    const verifiedUsers = await db.any(
      "SELECT * FROM users WHERE email_verified = true AND role != 'admin' ORDER BY created_at DESC"
    );
    
    // Get admin users (to show they will be preserved)
    const adminUsers = await db.any(
      "SELECT * FROM users WHERE email_verified = true AND role = 'admin' ORDER BY created_at DESC"
    );
    
    if (verifiedUsers.length === 0) {
      console.log('✅ No non-admin verified users found.');
      if (adminUsers.length > 0) {
        console.log(`\n👑 ${adminUsers.length} admin user(s) will be preserved:`);
        adminUsers.forEach(user => {
          console.log(`   - ${user.email} (${user.name})`);
        });
      }
      await db.$pool.end();
      process.exit(0);
    }
    
    console.log(`📋 Found ${verifiedUsers.length} verified user(s) to delete`);
    console.log('\n👥 Users to be deleted:');
    verifiedUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.name}) - Role: ${user.role}`);
    });
    
    if (adminUsers.length > 0) {
      console.log(`\n👑 ${adminUsers.length} admin user(s) will be PRESERVED:`);
      adminUsers.forEach(user => {
        console.log(`   ✓ ${user.email} (${user.name})`);
      });
    }
    
    // Warning prompt
    console.log('\n⚠️  WARNING: This will permanently delete all non-admin verified users!');
    console.log('⚠️  This includes their associated talent applications (CASCADE).');
    console.log('⚠️  Admin users will be preserved.');
    console.log('');
    
    // Check if we're in non-interactive mode (has --yes flag)
    const hasYesFlag = process.argv.includes('--yes') || process.argv.includes('-y');
    
    if (!hasYesFlag) {
      console.log('❌ Operation cancelled. To proceed, run with --yes flag:');
      console.log(`   node cleanup-verified-users.js "${DATABASE_URL}" --yes`);
      await db.$pool.end();
      process.exit(0);
    }
    
    let deletedUsersCount = 0;
    let deletedApplicationsCount = 0;
    
    // Process each verified user
    for (const user of verifiedUsers) {
      console.log(`\n🔍 Processing user: ${user.id} (${user.email})`);
      
      // Check if user has any talent applications
      const applications = await db.any(
        'SELECT id, status FROM talent_applications WHERE user_id = $1',
        [user.id]
      );
      
      if (applications.length > 0) {
        console.log(`📎 User has ${applications.length} associated application(s):`);
        applications.forEach(app => {
          console.log(`   - Application ID: ${app.id}, Status: ${app.status}`);
        });
        deletedApplicationsCount += applications.length;
      }
      
      // Delete the user (CASCADE will automatically delete related applications)
      try {
        await db.none('DELETE FROM users WHERE id = $1', [user.id]);
        console.log(`✅ Deleted user: ${user.email} (${user.name})`);
        deletedUsersCount++;
      } catch (error) {
        console.log(`❌ Error deleting user ${user.id}:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Cleanup completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Users deleted: ${deletedUsersCount}`);
    console.log(`   - Associated applications deleted: ${deletedApplicationsCount}`);
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
cleanupVerifiedUsers();

