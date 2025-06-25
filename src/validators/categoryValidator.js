//categoryValidator.js

const { body, param, query } = require('express-validator');
const { models } = require('../models');
const { Category } = models;

// Validation rules for creating category
const validateCategoryCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .custom(async (value) => {
      const existingCategory = await Category.findOne({ 
        where: { name: value } 
      });
      if (existingCategory) {
        throw new Error('Category name already exists');
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image must be a valid URL'),

  body('parent_id')
    .optional()
    .isUUID()
    .withMessage('Parent ID must be a valid UUID')
    .custom(async (value) => {
      if (value) {
        const parentCategory = await Category.findByPk(value);
        if (!parentCategory) {
          throw new Error('Parent category not found');
        }
      }
      return true;
    }),

  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),

  body('seo_title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('SEO title cannot exceed 200 characters'),

  body('seo_description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('SEO description cannot exceed 500 characters'),

  body('seo_keywords')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('SEO keywords cannot exceed 300 characters')
];

// Validation rules for updating category
const validateCategoryUpdate = [
  param('id')
    .isUUID()
    .withMessage('Category ID must be a valid UUID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters')
    .custom(async (value, { req }) => {
      if (value) {
        const existingCategory = await Category.findOne({ 
          where: { 
            name: value,
            id: { [require('sequelize').Op.ne]: req.params.id }
          } 
        });
        if (existingCategory) {
          throw new Error('Category name already exists');
        }
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('image')
    .optional()
    .trim()
    .isURL()
    .withMessage('Image must be a valid URL'),

  body('parent_id')
    .optional()
    .custom(async (value, { req }) => {
      if (value === null) return true; // Allow null for root categories
      
      if (value) {
        if (!require('validator').isUUID(value)) {
          throw new Error('Parent ID must be a valid UUID');
        }
        
        // Cannot be self-parent
        if (value === req.params.id) {
          throw new Error('Category cannot be its own parent');
        }
        
        const parentCategory = await Category.findByPk(value);
        if (!parentCategory) {
          throw new Error('Parent category not found');
        }
      }
      return true;
    }),

  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),

  body('seo_title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('SEO title cannot exceed 200 characters'),

  body('seo_description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('SEO description cannot exceed 500 characters'),

  body('seo_keywords')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('SEO keywords cannot exceed 300 characters')
];

// Validation for category ID parameter
const validateCategoryId = [
  param('id')
    .isUUID()
    .withMessage('Category ID must be a valid UUID')
];

// Validation for category slug parameter
const validateCategorySlug = [
  param('slug')
    .trim()
    .notEmpty()
    .withMessage('Category slug is required')
    .isLength({ min: 1, max: 150 })
    .withMessage('Slug must be between 1 and 150 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens')
];

// Validation for query parameters
const validateCategoryQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Active must be true or false'),

  query('parent_id')
    .optional()
    .custom((value) => {
      if (value === 'null') return true;
      if (!require('validator').isUUID(value)) {
        throw new Error('Parent ID must be a valid UUID or "null"');
      }
      return true;
    }),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  query('sortBy')
    .optional()
    .isIn(['name', 'sort_order', 'created_at', 'updated_at'])
    .withMessage('sortBy must be one of: name, sort_order, created_at, updated_at'),

  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('sortOrder must be ASC or DESC')
];

// Validation for reorder categories
const validateCategoryReorder = [
  body('categories')
    .isArray({ min: 1 })
    .withMessage('Categories must be a non-empty array'),

  body('categories.*.id')
    .isUUID()
    .withMessage('Each category must have a valid UUID')
];

module.exports = {
  validateCategoryCreate,
  validateCategoryUpdate,
  validateCategoryId,
  validateCategorySlug,
  validateCategoryQuery,
  validateCategoryReorder,
  // Alias for backward compatibility
  validateCategory: validateCategoryCreate
};