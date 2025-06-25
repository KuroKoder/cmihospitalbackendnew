const express = require('express');
const router = express.Router();
const CategoryController = require('../../controllers/categoryController');
const { verifyToken, requireAdmin, requireEditor, optionalAuth } = require('../../middleware/authCategory');
const {
  validateCategoryCreate,
  validateCategoryUpdate,
  validateCategoryId,
  validateCategorySlug,
  validateCategoryQuery,
  validateCategoryReorder
} = require('../../validators/categoryValidator');

// Public routes (no authentication required)
router.get('/', 
  validateCategoryQuery,
  optionalAuth, // Optional auth to get user-specific data if available
  CategoryController.getAll
);

router.get('/tree', 
  optionalAuth,
  CategoryController.getTree
);

router.get('/:slug', 
  validateCategorySlug,
  optionalAuth,
  CategoryController.getBySlug
);

// Protected routes (authentication required)
// Create category - Admin only
router.post('/', 
  verifyToken,
  requireAdmin,
  validateCategoryCreate,
  CategoryController.create
);

// Update category - Admin only
router.put('/:id', 
  verifyToken,
  requireAdmin,
  validateCategoryUpdate,
  CategoryController.update
);

// Delete category - Admin only
router.delete('/:id', 
  verifyToken,
  requireAdmin,
  validateCategoryId,
  CategoryController.delete
);

// Reorder categories - Admin only
router.put('/reorder', 
  verifyToken,
  requireAdmin,
  validateCategoryReorder,
  CategoryController.reorder
);

// Get category statistics - Editor or Admin
router.get('/:id/stats', 
  verifyToken,
  requireEditor,
  validateCategoryId,
  CategoryController.getStats
);

module.exports = router;