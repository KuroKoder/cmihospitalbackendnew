const express = require('express');
const router = express.Router();

const articleRoutes = require('./api/article');
const categoryRoutes = require('./api/categories');
const authRoutes = require('./api/auth');
const doctorRoutes = require('./api/doctors');
const pageRoutes = require('./api/pages');
const seoRoutes = require('./api/seo');
const userRoutes = require('./api/user');

// Define your routes
router.use('/articles', articleRoutes);
router.use('/categories', categoryRoutes);
router.use('/doctors', doctorRoutes);
router.use('/pages', pageRoutes);
router.use('/seo', seoRoutes);
router.use('/user', userRoutes);
router.use('/auth', authRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// API documentation endpoint
router.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Documentation',
    version: process.env.APP_VERSION || '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/logout': 'Logout user (requires auth)',
        'POST /api/auth/refresh': 'Refresh access token',
        'POST /api/auth/verify-email': 'Verify user email',
        'POST /api/auth/forgot-password': 'Request password reset',
        'POST /api/auth/reset-password': 'Reset password with token',
        'POST /api/auth/change-password': 'Change password (requires auth)',
        'GET /api/auth/profile': 'Get user profile (requires auth)',
        'PUT /api/auth/profile': 'Update user profile (requires auth)',
        'GET /api/auth/me': 'Get current user info (requires auth)',
        'POST /api/auth/validate-token': 'Validate token (requires auth)'
      },
      system: {
        'GET /health': 'Health check',
        'GET /api': 'API documentation'
      }
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      note: 'Include JWT token in Authorization header for protected routes'
    }
  });
});

// 404 handler for unmatched API routes
router.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: '/api'
  });
});

// General 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});


module.exports = router;
