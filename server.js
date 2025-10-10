const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// In-memory storage (replace with database later)
let users = [
  {
    id: '1',
    email: 'demo@example.com',
    name: 'Demo User',
    role: 'user',
    createdAt: new Date().toISOString(),
    emailVerified: true
  },
  {
    id: '2',
    email: 'admin@talento.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString(),
    emailVerified: true
  }
];

// Routes

// GET /api/users - Get all verified users
app.get('/api/users', (req, res) => {
  try {
    const verifiedUsers = users.filter(user => user.emailVerified === true);
    console.log('📊 GET /api/users - Returning', verifiedUsers.length, 'verified users');
    res.json({
      success: true,
      data: verifiedUsers,
      count: verifiedUsers.length
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
app.post('/api/users', (req, res) => {
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
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      console.log('⚠️ User already exists, updating:', email);
      existingUser.name = name;
      existingUser.mobile = mobile || '';
      existingUser.emailVerified = true;
      existingUser.updatedAt = new Date().toISOString();
      
      return res.json({
        success: true,
        message: 'User updated successfully',
        data: existingUser
      });
    }
    
    // Create new user
    const newUser = {
      id: uuidv4(),
      email,
      name,
      role: 'user',
      mobile: mobile || '',
      createdAt: new Date().toISOString(),
      emailVerified: true
    };
    
    users.push(newUser);
    
    console.log('✅ User created successfully:', newUser);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
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

// GET /api/users/stats - Get user statistics
app.get('/api/users/stats', (req, res) => {
  try {
    const allUsers = users;
    const verifiedUsers = users.filter(user => user.emailVerified === true);
    const adminUsers = verifiedUsers.filter(user => user.role === 'admin');
    const regularUsers = verifiedUsers.filter(user => user.role === 'user');
    
    const stats = {
      totalUsers: allUsers.length,
      verifiedUsers: verifiedUsers.length,
      adminUsers: adminUsers.length,
      regularUsers: regularUsers.length
    };
    
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
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Talento Backend is running',
    timestamp: new Date().toISOString(),
    users: users.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Talento Backend Server running on port', PORT);
  console.log('🌐 Frontend URL:', process.env.FRONTEND_URL);
  console.log('📊 Initial users:', users.length);
  console.log('🔗 API Endpoints:');
  console.log('   GET  /api/users - Get all verified users');
  console.log('   POST /api/users - Create new verified user');
  console.log('   GET  /api/users/stats - Get user statistics');
  console.log('   GET  /api/health - Health check');
});


