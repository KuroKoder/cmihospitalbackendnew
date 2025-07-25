// src/routes/api/article.js - Enhanced version
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ArticleController = require('../../controllers/articleController');
const { validateArticle } = require('../../validators/articleValidator');
const { verifyToken, requireAdmin, requireEditor, optionalAuth } = require('../../middleware/authCategory');
const { uploadConfigs } = require('../../middleware/uploadMiddleware');

// Rate limiting for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 upload requests per windowMs
  message: {
    success: false,
    message: 'Too many upload attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.get('/', ArticleController.getAll);
router.get('/search', ArticleController.search); // Add search endpoint
router.get('/popular', ArticleController.getPopular);
router.get('/categories/:category', ArticleController.getByCategory);
router.get('/tags/:tag', ArticleController.getByTag);
router.get('/:slug', ArticleController.getBySlug);
router.get('/:slug/related', ArticleController.getRelated);

// Protected routes with rate limiting
router.post('/', 
  verifyToken, 
  uploadLimiter,
  uploadConfigs.mixed,
  validateArticle, 
  ArticleController.create
);

router.put('/:id', 
  verifyToken,
  uploadLimiter,
  uploadConfigs.mixed,
  validateArticle, 
  ArticleController.update
);

router.delete('/:id', verifyToken, ArticleController.delete);

// Bulk operations (admin only)
router.put('/bulk-status', verifyToken, requireAdmin, ArticleController.bulkUpdateStatus);
router.delete('/bulk-delete', verifyToken, requireAdmin, ArticleController.bulkDelete);

// Draft operations
router.post('/draft', verifyToken, ArticleController.saveDraft);
router.get('/drafts', verifyToken, ArticleController.getDrafts);

// Enhanced error handling for multer
router.use((error, req, res, next) => {
  console.error('Upload error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum size is 5MB',
      error_code: 'FILE_TOO_LARGE'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many files. Maximum is 10 files',
      error_code: 'TOO_MANY_FILES'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field',
      error_code: 'UNEXPECTED_FILE'
    });
  }
  
  res.status(400).json({
    success: false,
    message: error.message || 'Upload error',
    error_code: 'UPLOAD_ERROR'
  });
});

module.exports = router;