const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
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

// File Upload Configuration
// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads', 'media-kits');
fs.ensureDirSync(uploadDir);

// Multer configuration for Render file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `talent-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Only allow images and PDFs
    const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed'));
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Admin verification middleware
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
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

// Talent Applications storage
let talentApplications = [];

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

// ==================== FILE UPLOAD ENDPOINTS ====================

// POST /api/upload/media-kit - Upload talent photos
app.post('/api/upload/media-kit', 
  upload.array('mediaKit', 10), 
  (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      console.log('📤 POST /api/upload/media-kit - Uploaded', req.files.length, 'files');

      // Generate URLs for uploaded files
      const fileUrls = req.files.map(file => {
        return `${req.protocol}://${req.get('host')}/uploads/media-kits/${file.filename}`;
      });

      res.json({
        success: true,
        files: req.files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          url: `${req.protocol}://${req.get('host')}/uploads/media-kits/${file.filename}`
        })),
        urls: fileUrls
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE /api/upload/media-kit/:filename - Delete uploaded file
app.delete('/api/upload/media-kit/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    console.log('🗑️ DELETE /api/upload/media-kit/:filename - Deleting file:', filename);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('✅ File deleted successfully:', filename);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      console.log('⚠️ File not found:', filename);
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/media-kits - List all uploaded files (admin only)
app.get('/api/admin/media-kits', verifyAdmin, async (req, res) => {
  try {
    console.log('📂 GET /api/admin/media-kits - Listing all files');
    
    const files = fs.readdirSync(uploadDir);
    const fileList = files.map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        url: `${req.protocol}://${req.get('host')}/uploads/media-kits/${filename}`,
        size: stats.size,
        uploadedAt: stats.birthtime
      };
    });
    
    console.log('✅ Found', fileList.length, 'files');
    
    res.json({
      success: true,
      data: fileList,
      count: fileList.length
    });
  } catch (error) {
    console.error('❌ Error listing files:', error);
    res.status(500).json({ error: error.message });
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
    
    // Validate required fields
    if (!fullName || !birthYear || !city || !phone || !termsAccepted) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fullName, birthYear, city, phone, termsAccepted'
      });
    }
    
    // Check if user already has a pending or verified application
    const existingApplication = talentApplications.find(
      app => app.userId === req.user.id && (app.status === 'pending' || app.status === 'verified')
    );
    
    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: `You already have a ${existingApplication.status} application`,
        existingApplication: {
          id: existingApplication.id,
          status: existingApplication.status,
          submittedAt: existingApplication.createdAt
        }
      });
    }
    
    // Create new talent application
    const newApplication = {
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
      termsAccepted: termsAccepted === true,
      
      // System Information
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: ''
    };
    
    talentApplications.push(newApplication);
    
    console.log('✅ Talent application created:', newApplication.id);
    
    res.status(201).json({
      success: true,
      message: 'Talent application submitted successfully',
      data: newApplication
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

// GET /api/talent/applications - Get all talent applications (authenticated users)
app.get('/api/talent/applications', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    console.log('📋 GET /api/talent/applications - Listing applications (filter:', status || 'all', ')');
    
    let filteredApplications = talentApplications;
    
    // Filter by status if provided
    if (status && ['pending', 'verified', 'rejected'].includes(status)) {
      filteredApplications = talentApplications.filter(app => app.status === status);
    }
    
    // Sort by creation date (newest first)
    filteredApplications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log('✅ Found', filteredApplications.length, 'applications');
    
    res.json({
      success: true,
      data: filteredApplications,
      count: filteredApplications.length,
      stats: {
        total: talentApplications.length,
        pending: talentApplications.filter(a => a.status === 'pending').length,
        verified: talentApplications.filter(a => a.status === 'verified').length,
        rejected: talentApplications.filter(a => a.status === 'rejected').length
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
    
    const userApplication = talentApplications.find(app => app.userId === req.user.id);
    
    if (!userApplication) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this user'
      });
    }
    
    res.json({
      success: true,
      data: userApplication
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
    
    const application = talentApplications.find(app => app.id === id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    res.json({
      success: true,
      data: application
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
    
    const applicationIndex = talentApplications.findIndex(app => app.id === id);
    
    if (applicationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Update application
    talentApplications[applicationIndex].status = status;
    talentApplications[applicationIndex].reviewedAt = new Date().toISOString();
    talentApplications[applicationIndex].reviewedBy = req.user.id;
    talentApplications[applicationIndex].reviewNotes = reviewNotes || '';
    talentApplications[applicationIndex].updatedAt = new Date().toISOString();
    
    const updatedApplication = talentApplications[applicationIndex];
    
    console.log('✅ Application status updated:', updatedApplication.id, '->', status);
    
    res.json({
      success: true,
      message: `Application ${status} successfully`,
      data: updatedApplication
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
    
    const applicationIndex = talentApplications.findIndex(app => app.id === id);
    
    if (applicationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    const deletedApplication = talentApplications[applicationIndex];
    talentApplications.splice(applicationIndex, 1);
    
    console.log('✅ Application deleted:', id);
    
    res.json({
      success: true,
      message: 'Application deleted successfully',
      deletedApplication: {
        id: deletedApplication.id,
        fullName: deletedApplication.fullName,
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
    
    const stats = {
      totalApplications: talentApplications.length,
      pending: talentApplications.filter(a => a.status === 'pending').length,
      verified: talentApplications.filter(a => a.status === 'verified').length,
      rejected: talentApplications.filter(a => a.status === 'rejected').length,
      recentApplications: talentApplications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(app => ({
          id: app.id,
          fullName: app.fullName,
          status: app.status,
          createdAt: app.createdAt
        }))
    };
    
    res.json({
      success: true,
      data: stats
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

// Start server
app.listen(PORT, () => {
  console.log('🚀 Talento Backend Server running on port', PORT);
  console.log('🌐 Frontend URL:', process.env.FRONTEND_URL);
  console.log('📊 Initial users:', users.length);
  console.log('📝 Talent applications:', talentApplications.length);
  console.log('📂 Upload directory:', uploadDir);
  console.log('🔗 API Endpoints:');
  console.log('   === Authentication ===');
  console.log('   POST   /api/auth/login - User login');
  console.log('   POST   /api/auth/register - User registration');
  console.log('   GET    /api/auth/me - Get current user info');
  console.log('   === User Management ===');
  console.log('   GET    /api/users - Get all verified users');
  console.log('   POST   /api/users - Create new verified user');
  console.log('   PATCH  /api/users/:userId/role - Update user role');
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
  console.log('   PATCH  /api/talent/applications/:id/status - Approve/reject (admin)');
  console.log('   DELETE /api/talent/applications/:id - Delete application (admin)');
  console.log('   GET    /api/talent/stats - Get talent statistics (admin)');
  console.log('   === System ===');
  console.log('   GET    /api/health - Health check');
});


