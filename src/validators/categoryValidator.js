const { body } = require('express-validator');

const validateCategory = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 255 }).withMessage('Name must be less than 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('parent_id')
    .optional()
    .isUUID().withMessage('Parent ID must be a valid UUID'),
  body('sort_order')
    .optional()
    .isInt().withMessage('Sort order must be an integer'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean'),
  body('seo_title')
    .optional()
    .isLength({ max: 60 }).withMessage('SEO Title must be less than 60 characters'),
  body('seo_description')
    .optional()
    .isLength({ max: 160 }).withMessage('SEO Description must be less than 160 characters'),
  body('seo_keywords')
    .optional()
    .isLength({ max: 500 }).withMessage('SEO Keywords must be less than 500 characters'),
];

module.exports = { validateCategory };
