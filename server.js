const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://frontend-isadora.onrender.com',
    'http://localhost:8084'
  ],
  credentials: true
}));
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// In-memory storage (replace with database later)
let users = [
  {
    id: '1',
    email: 'demo@example.com',
    name: 'Demo User',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
    role: 'user',
    createdAt: new Date().toISOString(),
    emailVerified: true
  },
  {
    id: '2',
    email: 'admin@talento.com',
    name: 'Admin User',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
    role: 'admin',
    createdAt: new Date().toISOString(),
    emailVerified: true
  }
];

// Database helper functions
async function updateUserRole(userId, role) {
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  users[userIndex].role = role;
  users[userIndex].updatedAt = new Date().toISOString();
  
  // Return user without password
  const { password, ...userWithoutPassword } = users[userIndex];
  return userWithoutPassword;
}

async function deleteUser(userId) {
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  
  users.splice(userIndex, 1);
  return { deleted: true, userId };
}

// Routes

// POST /api/auth/login - User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 POST /api/auth/login - Attempting login for:', email);
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
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
          emailVerified: user.emailVerified
        }
      }
    });
    
  } catch (error) {
    console.error('❌ POST /api/auth/login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
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
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = {
      id: uuidv4(),
      email,
      name,
      password: hashedPassword,
      role: 'user',
      mobile: mobile || '',
      createdAt: new Date().toISOString(),
      emailVerified: true
    };
    
    users.push(newUser);
    
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
          emailVerified: newUser.emailVerified
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

// GET /api/auth/me - Get current user info
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.user.id);
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
        emailVerified: user.emailVerified
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

// GET /api/users - Get all verified users
app.get('/api/users', (req, res) => {
  try {
    const verifiedUsers = users.filter(user => user.emailVerified === true);
    // Remove password from response
    const safeUsers = verifiedUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
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
      
      // Remove password from response
      const { password, ...userWithoutPassword } = existingUser;
      
      return res.json({
        success: true,
        message: 'User updated successfully',
        data: userWithoutPassword
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
    
    // Remove password from response
    const { password, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userWithoutPassword
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

// PATCH /api/users/:userId/role - Update user role
app.patch('/api/users/:userId/role', async (req, res) => {
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
    const updatedUser = await updateUserRole(userId, role);
    
    console.log('✅ User role updated successfully:', updatedUser.email);
    
    res.json({
      success: true,
      data: updatedUser,
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

// DELETE /api/users/:userId - Delete user
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('🗑️ DELETE /api/users/:userId - Deleting user:', userId);
    
    // Delete user from database
    await deleteUser(userId);
    
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
  console.log('   POST  /api/auth/login - User login');
  console.log('   POST  /api/auth/register - User registration');
  console.log('   GET   /api/auth/me - Get current user info');
  console.log('   GET   /api/users - Get all verified users');
  console.log('   POST  /api/users - Create new verified user');
  console.log('   PATCH /api/users/:userId/role - Update user role');
  console.log('   DELETE /api/users/:userId - Delete user');
  console.log('   GET   /api/users/stats - Get user statistics');
  console.log('   GET   /api/health - Health check');
});


