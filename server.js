const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
require('dotenv').config();

// Database
const { db, initializeDatabase, userQueries, talentQueries, mediaQueries, bookingQueries, toCamelCase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://frontend-isadora.onrender.com',
    'http://localhost:8084',
    'http://localhost:8083'
  ],
  credentials: true
}));
app.use(express.json());

// File Upload Configuration - Cloudinary
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djecxub3z',
  api_key: process.env.CLOUDINARY_API_KEY || '366272344528798',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'AdsQ8kOg0_O83yzvm2kN0-o_Imw'
});

// Multer configuration for memory storage (to upload directly to Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10 // Max 10 files per request
  }
});

console.log('☁️ Cloudinary configured:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'djecxub3z',
  folder: 'talent-media-kits'
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  const secretToUse = JWT_SECRET || 'your-secret-key-change-in-production';
  
  jwt.verify(token, secretToUse, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin verification middleware
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  const secretToUse = JWT_SECRET || 'your-secret-key-change-in-production';
  
  jwt.verify(token, secretToUse, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    req.user = user;
    next();
  });
};

// Database is now initialized on server start (see bottom of file)
// All data is persisted in PostgreSQL

// Helper function to send password reset email using EmailJS
async function sendPasswordResetEmail(email, resetToken, userName) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  // Check if EmailJS is configured
  const emailJsServiceId = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID;
  const emailJsTemplateId = process.env.EMAILJS_TEMPLATE_ID || process.env.VITE_EMAILJS_TEMPLATE_ID;
  const emailJsPublicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.VITE_EMAILJS_PUBLIC_KEY;
  
  if (!emailJsServiceId || !emailJsTemplateId || !emailJsPublicKey) {
    console.log('⚠️ EmailJS not configured. Reset token:', resetToken);
    console.log('⚠️ Reset URL:', resetUrl);
    return false;
  }
  
  try {
    // EmailJS REST API endpoint
    const emailJsUrl = 'https://api.emailjs.com/api/v1.0/email/send';
    
    const emailData = {
      service_id: emailJsServiceId,
      template_id: emailJsTemplateId,
      user_id: emailJsPublicKey,
      template_params: {
        to_email: email,
        to_name: userName,
        reset_url: resetUrl,
        reset_token: resetToken,
        user_name: userName
      }
    };
    
    const response = await fetch(emailJsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (response.ok) {
      console.log('✅ Password reset email sent via EmailJS to:', email);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ EmailJS error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending email via EmailJS:', error);
    return false;
  }
}

// Routes

// POST /api/auth/login - User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 POST /api/auth/login - Attempting login for:', email);
    
    // Validate required fields
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Test database connection first
    console.log('🔍 Testing database connection...');
    try {
      await db.one('SELECT 1 as test');
      console.log('✅ Database connection OK');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
      throw new Error('Database connection failed: ' + dbError.message);
    }
    
    // Find user
    console.log('🔍 Looking for user:', email);
    const user = await userQueries.findByEmail(email);
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      role: user.role
    });
    
    // Check if user has a password
    if (!user.password) {
      console.error('❌ User has no password set:', email);
      return res.status(500).json({
        success: false,
        message: 'Account configuration error - no password set'
      });
    }
    
    // Check password
    console.log('🔍 Checking password...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    console.log('✅ Password valid for:', email);
    
    // Check JWT_SECRET
    console.log('🔍 JWT_SECRET check:', {
      exists: !!JWT_SECRET,
      length: JWT_SECRET ? JWT_SECRET.length : 0,
      isDefault: JWT_SECRET === 'your-secret-key-change-in-production'
    });
    
    // Use default secret if not configured (for development/testing)
    const secretToUse = JWT_SECRET || 'your-secret-key-change-in-production';
    
    // Generate JWT token
    console.log('🔍 Generating JWT token...');
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      secretToUse,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login successful for:', email);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.email_verified
        }
      }
    });
    
  } catch (error) {
    console.error('❌ POST /api/auth/login error:', error.message);
    console.error('❌ Full error:', error);
    
    // More specific error handling
    if (error.message.includes('Database connection failed')) {
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: error.message
      });
    }
    
    if (error.message.includes('bcrypt')) {
      return res.status(500).json({
        success: false,
        message: 'Password verification failed',
        error: error.message
      });
    }
    
    if (error.message.includes('jwt')) {
      return res.status(500).json({
        success: false,
        message: 'Token generation failed',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// POST /api/auth/register - User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, mobile } = req.body;
    
    console.log('📝 POST /api/auth/register - Registering user:', { email, name });
    
    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await userQueries.findByEmail(email);
    if (existingUser) {
      // If user exists but has no password, allow them to set one
      if (!existingUser.password) {
        console.log('🔄 User exists without password, setting password for:', email);
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Update existing user with password
        const updatedUser = await userQueries.update(existingUser.id, {
          password: hashedPassword,
          name: name || existingUser.name,
          mobile: mobile || existingUser.mobile
        });
        
        console.log('✅ Password set successfully for existing user:', email);
        
        return res.status(200).json({
          success: true,
          message: 'Password set successfully for existing account',
          data: {
            user: {
              id: updatedUser.id,
              email: updatedUser.email,
              name: updatedUser.name,
              role: updatedUser.role,
              emailVerified: updatedUser.email_verified
            }
          }
        });
      }
      
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = await userQueries.create({
      id: uuidv4(),
      email,
      name,
      password: hashedPassword,
      role: 'user',
      mobile: mobile || '',
      emailVerified: true
    });
    
    console.log('✅ User registered successfully:', newUser.email);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          emailVerified: newUser.email_verified
        }
      }
    });
    
  } catch (error) {
    console.error('❌ POST /api/auth/register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

// POST /api/auth/forgot-password - Request password reset
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔐 POST /api/auth/forgot-password - Password reset request for:', email);
    
    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Find user by email
    const user = await userQueries.findByEmail(email);
    
    if (!user) {
      // For security, don't reveal if user exists or not
      console.log('⚠️ Password reset requested for non-existent email:', email);
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set expiry to 1 hour from now
    const expiryDate = new Date(Date.now() + 3600000); // 1 hour
    
    // Save reset token to database
    await userQueries.saveResetToken(email, resetToken, expiryDate);
    
    console.log('✅ Reset token generated for:', email);
    
    // Send email
    const emailSent = await sendPasswordResetEmail(email, resetToken, user.name);
    
    // If email is not configured, return the token in the response (for development)
    const emailJsConfigured = process.env.EMAILJS_SERVICE_ID || process.env.VITE_EMAILJS_SERVICE_ID;
    
    if (!emailSent && !emailJsConfigured) {
      return res.json({
        success: true,
        message: 'Password reset token generated (email not configured)',
        resetToken: resetToken, // Only for development!
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      });
    }
    
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
    
  } catch (error) {
    console.error('❌ POST /api/auth/forgot-password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// POST /api/auth/reset-password - Reset password with token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    console.log('🔐 POST /api/auth/reset-password - Resetting password with token');
    
    // Validate required fields
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }
    
    // Validate password strength (minimum 6 characters)
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Find user by reset token
    const user = await userQueries.findByResetToken(token);
    
    if (!user) {
      console.log('❌ Invalid or expired reset token');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    console.log('✅ Valid reset token for user:', user.email);
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await userQueries.updatePassword(user.id, hashedPassword);
    
    // Clear reset token
    await userQueries.clearResetToken(user.id);
    
    console.log('✅ Password reset successful for:', user.email);
    
    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
    
  } catch (error) {
    console.error('❌ POST /api/auth/reset-password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// GET /api/auth/me - Get current user info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await userQueries.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.email_verified
      }
    });
  } catch (error) {
    console.error('❌ GET /api/auth/me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user info',
      error: error.message
    });
  }
});

// GET /api/auth/debug-user/:email - Debug user info (for troubleshooting)
app.get('/api/auth/debug-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    console.log('🔍 DEBUG: Checking user:', email);
    
    // Test database connection
    try {
      await db.one('SELECT 1 as test');
      console.log('✅ Database connection OK');
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        message: 'Database connection failed',
        error: dbError.message
      });
    }
    
    // Find user
    const user = await userQueries.findByEmail(email);
    
    if (!user) {
      return res.json({
        success: true,
        debug: {
          userExists: false,
          email: email,
          message: 'User not found in database'
        }
      });
    }
    
    res.json({
      success: true,
      debug: {
        userExists: true,
        email: user.email,
        id: user.id,
        name: user.name,
        role: user.role,
        hasPassword: !!user.password,
        passwordLength: user.password ? user.password.length : 0,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }
    });
    
  } catch (error) {
    console.error('❌ GET /api/auth/debug-user error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

// POST /api/auth/create-admin - Create admin user (for testing)
app.post('/api/auth/create-admin', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    console.log('👑 Creating admin user:', email);
    
    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await userQueries.findByEmail(email);
    if (existingUser) {
      // Update existing user to admin
      const updatedUser = await userQueries.update(existingUser.id, {
        role: 'admin',
        password: existingUser.password || await bcrypt.hash(password, 10)
      });
      
      return res.json({
        success: true,
        message: 'Existing user promoted to admin',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
            emailVerified: updatedUser.email_verified
          }
        }
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new admin user
    const newUser = await userQueries.create({
      id: uuidv4(),
      email,
      name,
      password: hashedPassword,
      role: 'admin',
      emailVerified: true
    });
    
    console.log('✅ Admin user created successfully:', newUser.email);
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          emailVerified: newUser.email_verified
        }
      }
    });
    
  } catch (error) {
    console.error('❌ POST /api/auth/create-admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin user',
      error: error.message
    });
  }
});

// GET /api/users - Get all verified users
app.get('/api/users', async (req, res) => {
  try {
    const verifiedUsers = await userQueries.getAllVerified();
    // Remove password from response and convert to camelCase
    const safeUsers = verifiedUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return toCamelCase(userWithoutPassword);
    });
    console.log('📊 GET /api/users - Returning', safeUsers.length, 'verified users');
    res.json({
      success: true,
      data: safeUsers,
      count: safeUsers.length
    });
  } catch (error) {
    console.error('❌ GET /api/users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// POST /api/users - Create new verified user
app.post('/api/users', async (req, res) => {
  try {
    const { email, name, mobile } = req.body;
    
    console.log('📝 POST /api/users - Creating user:', { email, name, mobile });
    
    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email and name are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await userQueries.findByEmail(email);
    if (existingUser) {
      console.log('⚠️ User already exists, updating:', email);
      const updatedUser = await userQueries.update(existingUser.id, {
        name,
        mobile: mobile || '',
        email_verified: true
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      return res.json({
        success: true,
        message: 'User updated successfully',
        data: toCamelCase(userWithoutPassword)
      });
    }
    
    // Create new user
    const newUser = await userQueries.create({
      id: uuidv4(),
      email,
      name,
      role: 'user',
      mobile: mobile || '',
      emailVerified: true
    });
    
    console.log('✅ User created successfully:', newUser.email);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: toCamelCase(userWithoutPassword)
    });
    
  } catch (error) {
    console.error('❌ POST /api/users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// PATCH /api/users/:userId/role - Update user role (admin only)
app.patch('/api/users/:userId/role', authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    console.log('🔄 PATCH /api/users/:userId/role - Updating role for user:', userId, 'to:', role);
    
    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"'
      });
    }
    
    // Update user role in database
    const updatedUser = await userQueries.updateRole(userId, role);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User role updated successfully:', updatedUser.email);
    
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json({
      success: true,
      data: toCamelCase(userWithoutPassword),
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('❌ PATCH /api/users/:userId/role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
});

// PATCH /api/users/:userId/mobile - Update user mobile (user owns or admin)
app.patch('/api/users/:userId/mobile', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { mobile } = req.body;
    
    console.log('🔄 PATCH /api/users/:userId/mobile - Updating mobile for user:', userId);
    
    // Check permissions: user can update their own, admin can update any
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own mobile number'
      });
    }
    
    // Validate mobile is provided
    if (mobile === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required'
      });
    }
    
    // Update user mobile in database
    const updatedUser = await userQueries.update(userId, { mobile });
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('✅ User mobile updated successfully:', updatedUser.email);
    
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.json({
      success: true,
      data: toCamelCase(userWithoutPassword),
      message: 'Mobile number updated successfully'
    });
  } catch (error) {
    console.error('❌ PATCH /api/users/:userId/mobile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update mobile number',
      error: error.message
    });
  }
});

// DELETE /api/users/:userId - Delete user
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🗑️ DELETE /api/users/:userId - Deleting user:', userId);
    
    // Delete user from database
    await userQueries.delete(userId);
    
    console.log('✅ User deleted successfully:', userId);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ DELETE /api/users/:userId error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// GET /api/users/stats - Get user statistics
app.get('/api/users/stats', async (req, res) => {
  try {
    const stats = await userQueries.getStats();
    
    console.log('📊 GET /api/users/stats - Returning stats:', stats);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ GET /api/users/stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const stats = await userQueries.getStats();
    res.json({
      success: true,
      message: 'Talento Backend is running',
      timestamp: new Date().toISOString(),
      users: stats.totalUsers,
      database: 'connected'
    });
  } catch (error) {
    res.json({
      success: true,
      message: 'Talento Backend is running',
      timestamp: new Date().toISOString(),
      database: 'error: ' + error.message
    });
  }
});

// ==================== FILE UPLOAD ENDPOINTS ====================

// POST /api/upload/media-kit - Upload talent photos to Cloudinary
app.post('/api/upload/media-kit', 
  upload.array('mediaKit', 10), 
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      console.log('📤 POST /api/upload/media-kit - Uploading', req.files.length, 'files to Cloudinary');

      // Upload each file to Cloudinary and save to database
      const uploadedFiles = [];
      const urls = [];
      
      for (const file of req.files) {
        try {
          // Generate unique public ID
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const publicId = `talent-media-kits/talent-${uniqueSuffix}`;
          
          // Upload to Cloudinary using upload method with buffer
          const cloudinaryResult = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            {
              folder: 'talent-media-kits',
              public_id: publicId,
              resource_type: 'auto',
              allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv', 'm4v', 'mpeg', 'mpg']
            }
          );
          
          const cloudinaryUrl = cloudinaryResult.secure_url; // ← Extract this URL
          
          console.log('✅ Cloudinary upload success:', cloudinaryUrl);

          // Save to database
          const mediaRecord = await mediaQueries.create({
            id: uuidv4(),
            userId: req.body.userId || null,
            talentId: req.body.talentId || null,
            filename: cloudinaryResult.public_id,
            originalName: file.originalname,
            cloudinaryUrl: cloudinaryUrl,
            cloudinaryPublicId: cloudinaryResult.public_id,
            fileSize: file.size,
            mimeType: file.mimetype
          });
          
          console.log('💾 Saved to database:', mediaRecord.id, '-', file.originalname, '- URL:', cloudinaryUrl);
          
          // ← Include URL in response
          uploadedFiles.push({
            id: mediaRecord.id,
            filename: mediaRecord.filename,
            originalName: mediaRecord.originalName,
            size: mediaRecord.fileSize,
            url: cloudinaryUrl, // ← Include URL in response
            cloudinaryPublicId: mediaRecord.cloudinaryPublicId
          });
          
          urls.push(cloudinaryUrl); // ← Add to URLs array
          
        } catch (error) {
          console.error('❌ Error uploading file:', file.originalname, error);
          throw error;
        }
      }

      console.log('✅ All files uploaded successfully. URLs:', urls);

      res.json({
        success: true,
        files: uploadedFiles,
        urls: urls, // ← Use the URLs array we built
        message: 'Files uploaded to Cloudinary and saved to database'
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
);

// DELETE /api/upload/media-kit/:id - Delete uploaded file from Cloudinary and database
app.delete('/api/upload/media-kit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ DELETE /api/upload/media-kit/:id - Deleting file:', id);
    
    // Get file from database
    const mediaFile = await mediaQueries.findById(id);
    
    if (!mediaFile) {
      console.log('⚠️ File not found in database:', id);
      return res.status(404).json({ 
        success: false,
        error: 'File not found' 
      });
    }
    
    // Delete from Cloudinary
    try {
      const cloudinaryResult = await cloudinary.uploader.destroy(mediaFile.cloudinaryPublicId);
      console.log('☁️ Cloudinary delete result:', cloudinaryResult.result);
    } catch (cloudinaryError) {
      console.warn('⚠️ Cloudinary delete warning:', cloudinaryError.message);
      // Continue even if Cloudinary delete fails (file might already be deleted)
    }
    
    // Delete from database
    await mediaQueries.delete(id);
    
    console.log('✅ File deleted from Cloudinary and database:', id);
    
    res.json({ 
      success: true, 
      message: 'File deleted successfully',
      deletedFile: {
        id: mediaFile.id,
        filename: mediaFile.filename,
        originalName: mediaFile.originalName
      }
    });
    
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET /api/admin/media-kits - List all uploaded files from database (admin only)
app.get('/api/admin/media-kits', verifyAdmin, async (req, res) => {
  try {
    console.log('📂 GET /api/admin/media-kits - Listing all files from database');
    
    const limit = parseInt(req.query.limit) || 100;
    const files = await mediaQueries.getAll(limit);
    
    // Get statistics
    const stats = await mediaQueries.getStats();
    
    console.log('✅ Found', files.length, 'files in database');
    
    res.json({
      success: true,
      data: files.map(file => toCamelCase(file)),
      count: files.length,
      stats: {
        totalFiles: stats.totalFiles,
        totalSize: stats.totalSize,
        totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
        uniqueUsers: stats.uniqueUsers,
        talentsWithMedia: stats.talentsWithMedia
      }
    });
  } catch (error) {
    console.error('❌ Error listing files:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET /api/media/user/:userId - Get all media for a specific user (admin only)
app.get('/api/media/user/:userId', verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('📸 GET /api/media/user/:userId - Getting media for user:', userId);
    
    const media = await mediaQueries.findByUserId(userId);
    
    res.json({
      success: true,
      data: media.map(file => toCamelCase(file)),
      count: media.length
    });
  } catch (error) {
    console.error('❌ Error fetching user media:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET /api/media/talent/:talentId - Get all media for a specific talent application
app.get('/api/media/talent/:talentId', async (req, res) => {
  try {
    const { talentId } = req.params;
    
    console.log('📸 GET /api/media/talent/:talentId - Getting media for talent:', talentId);
    
    const media = await mediaQueries.findByTalentId(talentId);
    
    res.json({
      success: true,
      data: media.map(file => toCamelCase(file)),
      count: media.length
    });
  } catch (error) {
    console.error('❌ Error fetching talent media:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET /api/media/stats - Get media upload statistics (admin only)
app.get('/api/media/stats', verifyAdmin, async (req, res) => {
  try {
    console.log('📊 GET /api/media/stats - Getting media statistics');
    
    const stats = await mediaQueries.getStats();
    
    res.json({
      success: true,
      data: {
        totalFiles: stats.totalFiles,
        totalSize: stats.totalSize,
        totalSizeMB: (stats.totalSize / (1024 * 1024)).toFixed(2),
        totalSizeGB: (stats.totalSize / (1024 * 1024 * 1024)).toFixed(2),
        uniqueUsers: stats.uniqueUsers,
        talentsWithMedia: stats.talentsWithMedia
      }
    });
  } catch (error) {
    console.error('❌ Error fetching media stats:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ==================== TALENT APPLICATION ENDPOINTS ====================

// POST /api/talent/applications - Submit talent application
app.post('/api/talent/applications', authenticateToken, async (req, res) => {
  try {
    const {
      // Personal Information
      fullName,
      birthYear,
      city,
      nickname,
      phone,
      bio,
      
      // Profile Information
      socialChannels,
      socialLinks,
      mediaKitUrls,
      contentCategories,
      
      // Availability Information
      availableForProducts,
      shippingAddress,
      availableForReels,
      availableNext3Months,
      availabilityPeriod,
      
      // Experience
      collaboratedAgencies,
      agenciesList,
      collaboratedBrands,
      brandsList,
      
      // Fiscal Information
      hasVAT,
      paymentMethods,
      
      // Terms
      termsAccepted
    } = req.body;
    
    console.log('📝 POST /api/talent/applications - New application from:', req.user.email);
    console.log('📋 Received mediaKitUrls:', mediaKitUrls);
    console.log('📋 mediaKitUrls type:', typeof mediaKitUrls);
    console.log('📋 mediaKitUrls length:', Array.isArray(mediaKitUrls) ? mediaKitUrls.length : 'not array');
    
    // Validate required fields
    if (!fullName || !birthYear || !city || !phone || !termsAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fullName, birthYear, city, phone, termsAccepted'
      });
    }
    
    // Check if user already has a pending or verified application
    // Admins can bypass this restriction to create multiple talents
    if (req.user.role !== 'admin') {
      const existingApplication = await talentQueries.findActiveByUserId(req.user.id);
      
      if (existingApplication) {
        return res.status(409).json({
          success: false,
          message: `You already have a ${existingApplication.status} application`,
          existingApplication: {
            id: existingApplication.id,
            status: existingApplication.status,
            submittedAt: existingApplication.created_at
          }
        });
      }
    }
    
    // Create new talent application
    const newApplication = await talentQueries.create({
      id: uuidv4(),
      userId: req.user.id,
      email: req.user.email,
      status: 'pending',
      
      // Personal Information
      fullName,
      birthYear: parseInt(birthYear),
      city,
      nickname: nickname || '',
      phone,
      bio: bio || '',
      
      // Profile Information
      socialChannels: socialChannels || [],
      socialLinks: socialLinks || '',
      mediaKitUrls: mediaKitUrls || [],
      contentCategories: contentCategories || [],
      
      // Availability Information
      availableForProducts: availableForProducts || 'No',
      shippingAddress: shippingAddress || '',
      availableForReels: availableForReels || 'No',
      availableNext3Months: availableNext3Months || 'No',
      availabilityPeriod: availabilityPeriod || '',
      
      // Experience
      collaboratedAgencies: collaboratedAgencies || 'No',
      agenciesList: agenciesList || '',
      collaboratedBrands: collaboratedBrands || 'No',
      brandsList: brandsList || '',
      
      // Fiscal Information
      hasVAT: hasVAT || 'No',
      paymentMethods: paymentMethods || [],
      
      // Terms
      termsAccepted: termsAccepted === true
    });
    
    console.log('✅ Talent application created:', newApplication.id);
    console.log('📋 Saved mediaKitUrls:', newApplication.media_kit_urls);
    console.log('📋 Saved mediaKitUrls type:', typeof newApplication.media_kit_urls);
    console.log('📋 Saved mediaKitUrls length:', Array.isArray(newApplication.media_kit_urls) ? newApplication.media_kit_urls.length : 'not array');
    
    res.status(201).json({
      success: true,
      message: 'Talent application submitted successfully',
      data: toCamelCase(newApplication)
    });
    
  } catch (error) {
    console.error('❌ POST /api/talent/applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message
    });
  }
});

// GET /api/talent/applications - Get all talent applications (public access)
app.get('/api/talent/applications', async (req, res) => {
  try {
    const { status } = req.query;
    
    console.log('📋 GET /api/talent/applications - Listing applications (filter:', status || 'all', ')');
    
    // Get applications with optional status filter
    const applications = await talentQueries.getAll(status);
    
    // Get stats
    const stats = await talentQueries.getStats();
    
    console.log('✅ Found', applications.length, 'applications');
    
    res.json({
      success: true,
      data: applications.map(app => toCamelCase(app)),
      count: applications.length,
      stats: {
        total: stats.totalApplications,
        pending: stats.pending,
        verified: stats.verified,
        rejected: stats.rejected
      }
    });
    
  } catch (error) {
    console.error('❌ GET /api/talent/applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message
    });
  }
});

// GET /api/talent/applications/me - Get current user's application
app.get('/api/talent/applications/me', authenticateToken, async (req, res) => {
  try {
    console.log('👤 GET /api/talent/applications/me - Getting application for user:', req.user.id);
    
    const userApplication = await talentQueries.findByUserId(req.user.id);
    
    if (!userApplication) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this user'
      });
    }
    
    res.json({
      success: true,
      data: toCamelCase(userApplication)
    });
    
  } catch (error) {
    console.error('❌ GET /api/talent/applications/me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
});

// GET /api/talent/applications/:id - Get specific talent application (admin only)
app.get('/api/talent/applications/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 GET /api/talent/applications/:id - Getting application:', id);
    
    const application = await talentQueries.findById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    res.json({
      success: true,
      data: toCamelCase(application)
    });
    
  } catch (error) {
    console.error('❌ GET /api/talent/applications/:id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message
    });
  }
});

// PATCH /api/talent/applications/:id - Update talent application (user owns or admin)
app.patch('/api/talent/applications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      city,
      phone,
      bio,
      socialChannels,
      socialLinks,
      mediaKitUrls,
      contentCategories,
      availableForProducts,
      shippingAddress,
      availableForReels,
      availableNext3Months,
      availabilityPeriod,
      hasVAT,
      paymentMethods,
      price
    } = req.body;
    
    console.log('🔄 PATCH /api/talent/applications/:id - Updating application:', id);
    
    // Get existing application
    const existingApplication = await talentQueries.findById(id);
    
    if (!existingApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Check permissions: user can update their own, admin can update any
    if (req.user.role !== 'admin' && existingApplication.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own application'
      });
    }
    
    // Build update object with only provided fields
    const updates = {};
    
    if (city !== undefined) updates.city = city;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (socialChannels !== undefined) updates.socialChannels = socialChannels;
    if (socialLinks !== undefined) updates.socialLinks = socialLinks;
    if (mediaKitUrls !== undefined) updates.mediaKitUrls = mediaKitUrls;
    if (contentCategories !== undefined) updates.contentCategories = contentCategories;
    if (availableForProducts !== undefined) updates.availableForProducts = availableForProducts;
    if (shippingAddress !== undefined) updates.shippingAddress = shippingAddress;
    if (availableForReels !== undefined) updates.availableForReels = availableForReels;
    if (availableNext3Months !== undefined) updates.availableNext3Months = availableNext3Months;
    if (availabilityPeriod !== undefined) updates.availabilityPeriod = availabilityPeriod;
    if (hasVAT !== undefined) updates.hasVAT = hasVAT;
    if (paymentMethods !== undefined) updates.paymentMethods = paymentMethods;
    
    // Price field - ADMIN ONLY
    if (price !== undefined) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can update the price field'
        });
      }
      
      // Validate price contains only € symbols
      if (price && !/^€*$/.test(price)) {
        return res.status(400).json({
          success: false,
          message: 'Price field must contain only € symbols (e.g., "€", "€€", "€€€")'
        });
      }
      
      updates.price = price;
    }
    
    // Update application
    const updatedApplication = await talentQueries.update(id, updates);
    
    console.log('✅ Application updated successfully:', id);
    
    res.json({
      success: true,
      message: 'Application updated successfully',
      data: toCamelCase(updatedApplication)
    });
    
  } catch (error) {
    console.error('❌ PATCH /api/talent/applications/:id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application',
      error: error.message
    });
  }
});

// PATCH /api/talent/applications/:id/status - Update application status (admin only)
app.patch('/api/talent/applications/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;
    
    console.log('🔄 PATCH /api/talent/applications/:id/status - Updating application:', id, 'to:', status);
    
    // Validate status
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "verified" or "rejected"'
      });
    }
    
    const updatedApplication = await talentQueries.updateStatus(id, status, req.user.id, reviewNotes);
    
    if (!updatedApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    console.log('✅ Application status updated:', updatedApplication.id, '->', status);
    
    res.json({
      success: true,
      message: `Application ${status} successfully`,
      data: toCamelCase(updatedApplication)
    });
    
  } catch (error) {
    console.error('❌ PATCH /api/talent/applications/:id/status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message
    });
  }
});

// DELETE /api/talent/applications/:id - Delete talent application (admin only)
app.delete('/api/talent/applications/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ DELETE /api/talent/applications/:id - Deleting application:', id);
    
    const deletedApplication = await talentQueries.delete(id);
    
    if (!deletedApplication) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    console.log('✅ Application deleted:', id);
    
    res.json({
      success: true,
      message: 'Application deleted successfully',
      deletedApplication: {
        id: deletedApplication.id,
        fullName: deletedApplication.full_name,
        status: deletedApplication.status
      }
    });
    
  } catch (error) {
    console.error('❌ DELETE /api/talent/applications/:id error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting application',
      error: error.message
    });
  }
});

// GET /api/talent/applications/stats - Get talent application statistics (admin only)
app.get('/api/talent/stats', verifyAdmin, async (req, res) => {
  try {
    console.log('📊 GET /api/talent/stats - Getting statistics');
    
    const stats = await talentQueries.getStats();
    
    // Convert recentApplications to camelCase
    const formattedStats = {
      ...stats,
      recentApplications: stats.recentApplications.map(app => toCamelCase(app))
    };
    
    res.json({
      success: true,
      data: formattedStats
    });
    
  } catch (error) {
    console.error('❌ GET /api/talent/stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// GET /api/talents - Get all verified talents (public endpoint)
app.get('/api/talents', async (req, res) => {
  try {
    console.log('🌟 GET /api/talents - Fetching verified talents');
    
    // Get only verified talent applications
    const verifiedTalents = await talentQueries.getAll('verified');
    
    console.log('✅ Found', verifiedTalents.length, 'verified talents');
    
    res.json({
      success: true,
      data: verifiedTalents.map(talent => toCamelCase(talent)),
      count: verifiedTalents.length
    });
    
  } catch (error) {
    console.error('❌ GET /api/talents error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verified talents',
      error: error.message
    });
  }
});

// PATCH /api/talents/:talentId/celebrity-status - Toggle celebrity status (admin only)
app.patch('/api/talents/:talentId/celebrity-status', verifyAdmin, async (req, res) => {
  try {
    const { talentId } = req.params;
    const { isCelebrity } = req.body;
    
    console.log('⭐ PATCH /api/talents/:talentId/celebrity-status - Toggling celebrity status for:', talentId, 'to:', isCelebrity);
    
    // Validate isCelebrity field
    if (typeof isCelebrity !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isCelebrity field is required and must be a boolean'
      });
    }
    
    // Check if talent exists
    const existingTalent = await talentQueries.findById(talentId);
    if (!existingTalent) {
      return res.status(404).json({
        success: false,
        message: 'Talent not found'
      });
    }
    
    // Update celebrity status
    const updatedTalent = await talentQueries.toggleCelebrityStatus(talentId, isCelebrity);
    
    console.log('✅ Celebrity status updated for:', updatedTalent.full_name, '- isCelebrity:', isCelebrity);
    
    res.json({
      success: true,
      message: `Celebrity status ${isCelebrity ? 'enabled' : 'disabled'} successfully`,
      data: toCamelCase(updatedTalent)
    });
    
  } catch (error) {
    console.error('❌ PATCH /api/talents/:talentId/celebrity-status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating celebrity status',
      error: error.message
    });
  }
});

// POST /api/talents/:talentId/track-click - Track talent click (public endpoint)
app.post('/api/talents/:talentId/track-click', async (req, res) => {
  try {
    const { talentId } = req.params;
    const { timestamp, userAgent, ipAddress } = req.body;
    
    console.log('👆 POST /api/talents/:talentId/track-click - Tracking click for:', talentId);
    
    // Check if talent exists
    const existingTalent = await talentQueries.findById(talentId);
    if (!existingTalent) {
      return res.status(404).json({
        success: false,
        message: 'Talent not found'
      });
    }
    
    // Track click (increment counter)
    await talentQueries.trackClick(talentId);
    
    // Optional: Log additional analytics data
    if (timestamp || userAgent || ipAddress) {
      console.log('📊 Click analytics:', {
        talentId,
        timestamp,
        userAgent: userAgent ? userAgent.substring(0, 50) + '...' : 'N/A',
        ipAddress: ipAddress || 'N/A'
      });
    }
    
    console.log('✅ Click tracked successfully for talent:', talentId);
    
    res.json({
      success: true,
      message: 'Click tracked successfully'
    });
    
  } catch (error) {
    console.error('❌ POST /api/talents/:talentId/track-click error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking click',
      error: error.message
    });
  }
});

// ==================== BOOKING ENDPOINTS ====================

// POST /api/bookings - Create new booking
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      userName,
      phoneNumber,
      timeSlot,
      talents,
      priceRange,
      userIdea,
      status
    } = req.body;
    
    console.log('📅 POST /api/bookings - Creating booking for:', req.user.email);
    
    // Validate required fields
    if (!userId || !userEmail || !userName || !timeSlot || !talents || !priceRange) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, userEmail, userName, timeSlot, talents, priceRange'
      });
    }
    
    // Validate timeSlot structure
    if (!timeSlot.date || !timeSlot.time || !timeSlot.datetime) {
      return res.status(400).json({
        success: false,
        message: 'timeSlot must include date, time, and datetime fields'
      });
    }
    
    // Validate talents is an array
    if (!Array.isArray(talents) || talents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'talents must be a non-empty array'
      });
    }
    
    // Validate status if provided
    const validStatuses = ['in attesa di conferma', 'confermata', 'fatta', 'cancellata'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: in attesa di conferma, confermata, fatta, cancellata'
      });
    }
    
    // Generate booking ID with BOOK- prefix
    const bookingId = 'BOOK-' + Date.now();
    
    // Create new booking
    const newBooking = await bookingQueries.create({
      id: bookingId,
      userId,
      userEmail,
      userName,
      phoneNumber: phoneNumber || null,
      timeSlotDate: timeSlot.date,
      timeSlotTime: timeSlot.time,
      timeSlotDatetime: timeSlot.datetime,
      talents,
      priceRange,
      userIdea: userIdea || null,
      status: status || 'in attesa di conferma'
    });
    
    console.log('✅ Booking created successfully:', newBooking.id);
    
    // Format response
    const response = {
      id: newBooking.id,
      userId: newBooking.user_id,
      userEmail: newBooking.user_email,
      userName: newBooking.user_name,
      phoneNumber: newBooking.phone_number,
      timeSlot: {
        date: newBooking.time_slot_date,
        time: newBooking.time_slot_time,
        datetime: newBooking.time_slot_datetime
      },
      talents: typeof newBooking.talents === 'string' ? JSON.parse(newBooking.talents) : newBooking.talents,
      priceRange: newBooking.price_range,
      userIdea: newBooking.user_idea,
      status: newBooking.status,
      createdAt: newBooking.created_at,
      updatedAt: newBooking.updated_at
    };
    
    res.status(201).json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('❌ POST /api/bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
});

// GET /api/bookings - Get all bookings (admin only)
app.get('/api/bookings', verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    
    console.log('📋 GET /api/bookings - Listing bookings (filter:', status || 'all', ')');
    
    // Get bookings with optional status filter
    const bookings = await bookingQueries.getAll(status);
    
    // Get stats
    const stats = await bookingQueries.getStats();
    
    console.log('✅ Found', bookings.length, 'bookings');
    
    // Format bookings for response
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      userId: booking.user_id,
      userEmail: booking.user_email,
      userName: booking.user_name,
      phoneNumber: booking.phone_number,
      timeSlot: {
        date: booking.time_slot_date,
        time: booking.time_slot_time,
        datetime: booking.time_slot_datetime
      },
      talents: typeof booking.talents === 'string' ? JSON.parse(booking.talents) : booking.talents,
      priceRange: booking.price_range,
      userIdea: booking.user_idea,
      status: booking.status,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    }));
    
    res.json({
      success: true,
      data: formattedBookings,
      count: formattedBookings.length,
      stats: {
        total: stats.totalBookings,
        inAttesaDiConferma: stats.inAttesaDiConferma,
        confermata: stats.confermata,
        fatta: stats.fatta,
        cancellata: stats.cancellata
      }
    });
    
  } catch (error) {
    console.error('❌ GET /api/bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
      error: error.message
    });
  }
});

// GET /api/bookings/:bookingId - Get specific booking
app.get('/api/bookings/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    console.log('🔍 GET /api/bookings/:bookingId - Getting booking:', bookingId);
    
    const booking = await bookingQueries.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Format response
    const response = {
      id: booking.id,
      userId: booking.user_id,
      userEmail: booking.user_email,
      userName: booking.user_name,
      phoneNumber: booking.phone_number,
      timeSlot: {
        date: booking.time_slot_date,
        time: booking.time_slot_time,
        datetime: booking.time_slot_datetime
      },
      talents: typeof booking.talents === 'string' ? JSON.parse(booking.talents) : booking.talents,
      priceRange: booking.price_range,
      userIdea: booking.user_idea,
      status: booking.status,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    };
    
    res.json({
      success: true,
      data: response
    });
    
  } catch (error) {
    console.error('❌ GET /api/bookings/:bookingId error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: error.message
    });
  }
});

// PATCH /api/bookings/:bookingId/status - Update booking status (admin only)
app.patch('/api/bookings/:bookingId/status', verifyAdmin, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    console.log('🔄 PATCH /api/bookings/:bookingId/status - Updating booking:', bookingId, 'to:', status);
    
    // Validate status
    const validStatuses = ['in attesa di conferma', 'confermata', 'fatta', 'cancellata'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: in attesa di conferma, confermata, fatta, cancellata'
      });
    }
    
    const updatedBooking = await bookingQueries.updateStatus(bookingId, status);
    
    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    console.log('✅ Booking status updated:', updatedBooking.id, '->', status);
    
    // Format response
    const response = {
      id: updatedBooking.id,
      userId: updatedBooking.user_id,
      userEmail: updatedBooking.user_email,
      userName: updatedBooking.user_name,
      phoneNumber: updatedBooking.phone_number,
      timeSlot: {
        date: updatedBooking.time_slot_date,
        time: updatedBooking.time_slot_time,
        datetime: updatedBooking.time_slot_datetime
      },
      talents: typeof updatedBooking.talents === 'string' ? JSON.parse(updatedBooking.talents) : updatedBooking.talents,
      priceRange: updatedBooking.price_range,
      userIdea: updatedBooking.user_idea,
      status: updatedBooking.status,
      createdAt: updatedBooking.created_at,
      updatedAt: updatedBooking.updated_at
    };
    
    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: response
    });
    
  } catch (error) {
    console.error('❌ PATCH /api/bookings/:bookingId/status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking status',
      error: error.message
    });
  }
});

// GET /api/bookings/user/:userId - Get user's bookings (any authenticated user)
app.get('/api/bookings/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('👤 GET /api/bookings/user/:userId - Getting bookings for user:', userId);
    
    const bookings = await bookingQueries.findByUserId(userId);
    
    // Format bookings for response
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      userId: booking.user_id,
      userEmail: booking.user_email,
      userName: booking.user_name,
      phoneNumber: booking.phone_number,
      timeSlot: {
        date: booking.time_slot_date,
        time: booking.time_slot_time,
        datetime: booking.time_slot_datetime
      },
      talents: typeof booking.talents === 'string' ? JSON.parse(booking.talents) : booking.talents,
      priceRange: booking.price_range,
      userIdea: booking.user_idea,
      status: booking.status,
      createdAt: booking.created_at,
      updatedAt: booking.updated_at
    }));
    
    res.json({
      success: true,
      data: formattedBookings,
      count: formattedBookings.length
    });
    
  } catch (error) {
    console.error('❌ GET /api/bookings/user/:userId error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user bookings',
      error: error.message
    });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, () => {
      console.log('🚀 Talento Backend Server running on port', PORT);
      console.log('🌐 Frontend URL:', process.env.FRONTEND_URL);
      console.log('💾 Database: PostgreSQL (connected)');
      console.log('☁️ Storage: Cloudinary (talent-media-kits)');
      console.log('🔗 API Endpoints:');
      console.log('   === Authentication ===');
      console.log('   POST   /api/auth/login - User login');
      console.log('   POST   /api/auth/register - User registration');
      console.log('   POST   /api/auth/forgot-password - Request password reset');
      console.log('   POST   /api/auth/reset-password - Reset password with token');
      console.log('   GET    /api/auth/me - Get current user info');
      console.log('   === User Management ===');
      console.log('   GET    /api/users - Get all verified users');
      console.log('   POST   /api/users - Create new verified user');
      console.log('   PATCH  /api/users/:userId/role - Update user role (admin only)');
      console.log('   PATCH  /api/users/:userId/mobile - Update user mobile (user owns or admin)');
      console.log('   DELETE /api/users/:userId - Delete user');
      console.log('   GET    /api/users/stats - Get user statistics');
      console.log('   === File Upload ===');
      console.log('   POST   /api/upload/media-kit - Upload talent photos');
      console.log('   DELETE /api/upload/media-kit/:filename - Delete file');
      console.log('   GET    /api/admin/media-kits - List all files (admin)');
      console.log('   GET    /uploads/* - Serve uploaded files');
      console.log('   === Talent Applications ===');
      console.log('   POST   /api/talent/applications - Submit talent application');
      console.log('   GET    /api/talent/applications - List all applications (authenticated)');
      console.log('   GET    /api/talent/applications/me - Get my application');
      console.log('   GET    /api/talent/applications/:id - Get specific application (admin)');
      console.log('   PATCH  /api/talent/applications/:id - Update application (user/admin)');
      console.log('   PATCH  /api/talent/applications/:id/status - Approve/reject (admin)');
      console.log('   DELETE /api/talent/applications/:id - Delete application (admin)');
      console.log('   GET    /api/talent/stats - Get talent statistics (admin)');
      console.log('   === Verified Talents ===');
      console.log('   GET    /api/talents - Get all verified talents (public)');
      console.log('   PATCH  /api/talents/:talentId/celebrity-status - Toggle celebrity status (admin)');
      console.log('   POST   /api/talents/:talentId/track-click - Track talent click (public)');
      console.log('   === Bookings ===');
      console.log('   POST   /api/bookings - Create new booking (authenticated)');
      console.log('   GET    /api/bookings - Get all bookings (admin)');
      console.log('   GET    /api/bookings/:bookingId - Get specific booking (authenticated)');
      console.log('   PATCH  /api/bookings/:bookingId/status - Update booking status (admin)');
      console.log('   GET    /api/bookings/user/:userId - Get user bookings (authenticated)');
      console.log('   === System ===');
      console.log('   GET    /api/health - Health check');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();


