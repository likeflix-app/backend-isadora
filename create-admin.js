const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { db, userQueries } = require('./db');
require('dotenv').config();

// Admin credentials - change these as needed
const ADMIN_EMAIL = 'admin@isadora.com';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_NAME = 'Isadora Admin';

async function createAdmin() {
  try {
    console.log('👑 Creating admin user...');
    console.log('📧 Email:', ADMIN_EMAIL);
    
    // Check if admin already exists
    const existingUser = await userQueries.findByEmail(ADMIN_EMAIL);
    
    if (existingUser) {
      console.log('⚠️  User already exists with email:', ADMIN_EMAIL);
      
      // Update existing user to admin role if not already
      if (existingUser.role !== 'admin') {
        console.log('🔄 Promoting user to admin...');
        const updatedUser = await userQueries.updateRole(existingUser.id, 'admin');
        console.log('✅ User promoted to admin successfully!');
        console.log('   ID:', updatedUser.id);
        console.log('   Email:', updatedUser.email);
        console.log('   Name:', updatedUser.name);
        console.log('   Role:', updatedUser.role);
      } else {
        console.log('ℹ️  User is already an admin');
        console.log('   ID:', existingUser.id);
        console.log('   Email:', existingUser.email);
        console.log('   Name:', existingUser.name);
        console.log('   Role:', existingUser.role);
      }
    } else {
      // Hash password
      console.log('🔐 Hashing password...');
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      // Create new admin user
      console.log('📝 Creating new admin user...');
      const newAdmin = await userQueries.create({
        id: uuidv4(),
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        password: hashedPassword,
        role: 'admin',
        mobile: '',
        emailVerified: true
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('   ID:', newAdmin.id);
      console.log('   Email:', newAdmin.email);
      console.log('   Name:', newAdmin.name);
      console.log('   Role:', newAdmin.role);
      console.log('');
      console.log('🔑 Login credentials:');
      console.log('   Email:', ADMIN_EMAIL);
      console.log('   Password:', ADMIN_PASSWORD);
    }
    
    // Show all admin users
    console.log('');
    console.log('📊 All admin users in the system:');
    const allUsers = await db.any('SELECT id, email, name, role FROM users WHERE role = $1', ['admin']);
    allUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createAdmin();

