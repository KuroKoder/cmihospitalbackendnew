// routes/index.js - Debug version
console.log('🔍 Mulai load routes/index.js');

const express = require('express');
console.log('✅ Express loaded in routes');

const router = express.Router();
console.log('✅ Router created');

// Debug each route file one by one
console.log('🔍 Loading route files...');

let articleRoutes, categoryRoutes, authRoutes, doctorRoutes, pageRoutes, seoRoutes, userRoutes, uploadRoutes;

try {
  console.log('🔍 Loading article routes...');
  articleRoutes = require('./api/article');
  console.log('✅ Article routes loaded');
} catch (error) {
  console.error('❌ Error loading article routes:', error.message);
  articleRoutes = null;
}

try {
  console.log('🔍 Loading category routes...');
  categoryRoutes = require('./api/categories');
  console.log('✅ Category routes loaded');
} catch (error) {
  console.error('❌ Error loading category routes:', error.message);
  categoryRoutes = null;
}

try {
  console.log('🔍 Loading auth routes...');
  authRoutes = require('./api/auth');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
  authRoutes = null;
}

try {
  console.log('🔍 Loading doctor routes...');
  doctorRoutes = require('./api/doctors');
  console.log('✅ Doctor routes loaded');
} catch (error) {
  console.error('❌ Error loading doctor routes:', error.message);
  doctorRoutes = null;
}

try {
  console.log('🔍 Loading page routes...');
  pageRoutes = require('./api/pages');
  console.log('✅ Page routes loaded');
} catch (error) {
  console.error('❌ Error loading page routes:', error.message);
  pageRoutes = null;
}

try {
  console.log('🔍 Loading SEO routes...');
  seoRoutes = require('./api/seo');
  console.log('✅ SEO routes loaded');
} catch (error) {
  console.error('❌ Error loading SEO routes:', error.message);
  seoRoutes = null;
}

try {
  console.log('🔍 Loading user routes...');
  userRoutes = require('./api/user');
  console.log('✅ User routes loaded');
} catch (error) {
  console.error('❌ Error loading user routes:', error.message);
  userRoutes = null;
}

try {
  console.log('🔍 Loading upload routes...');
  uploadRoutes = require('./api/upload');
  console.log('✅ Upload routes loaded');
} catch (error) {
  console.error('❌ Error loading upload routes:', error.message);
  uploadRoutes = null;
}

console.log('🔍 Setting up route endpoints...');

// Define your routes - only if they loaded successfully
if (articleRoutes) {
  router.use('/articles', articleRoutes);
  console.log('✅ Article routes configured');
}

if (categoryRoutes) {
  router.use('/categories', categoryRoutes);
  console.log('✅ Category routes configured');
}

if (doctorRoutes) {
  router.use('/doctors', doctorRoutes);
  console.log('✅ Doctor routes configured');
}

if (pageRoutes) {
  router.use('/pages', pageRoutes);
  console.log('✅ Page routes configured');
}

if (seoRoutes) {
  router.use('/seo', seoRoutes);
  console.log('✅ SEO routes configured');
}

if (userRoutes) {
  router.use('/user', userRoutes);
  console.log('✅ User routes configured');
}

if (authRoutes) {
  router.use('/auth', authRoutes);
  console.log('✅ Auth routes configured');
}

if (uploadRoutes) {
  router.use('/upload', uploadRoutes);
  console.log('✅ Upload routes configured');
}

console.log('🔍 Setting up health check endpoint...');
// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});
console.log('✅ Health check endpoint configured');

console.log('🔍 Setting up API documentation endpoint...');
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
      articles: {
        'GET /api/articles': 'Get all articles',
        'GET /api/articles/:slug': 'Get article by slug',
        'POST /api/articles': 'Create new article (requires auth)',
        'PUT /api/articles/:id': 'Update article (requires auth)',
        'DELETE /api/articles/:id': 'Delete article (requires auth)',
        'GET /api/articles/:slug/related': 'Get related articles',
        'GET /api/articles/popular': 'Get popular articles',
        'PUT /api/articles/bulk-status': 'Bulk update article status (requires auth)'
      },
      upload: {
        'POST /api/upload/single': 'Upload single image (requires auth)',
        'POST /api/upload/featured': 'Upload featured image (requires auth)',
        'POST /api/upload/content': 'Upload content images (requires auth)',
        'POST /api/upload/mixed': 'Upload mixed images (requires auth)',
        'DELETE /api/upload/:filename': 'Delete uploaded file (requires auth)'
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
console.log('✅ API documentation endpoint configured');

console.log('🔍 Setting up 404 handlers...');
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
console.log('✅ 404 handlers configured');

console.log('🎉 Routes/index.js berhasil dimuat sepenuhnya!');
module.exports = router;