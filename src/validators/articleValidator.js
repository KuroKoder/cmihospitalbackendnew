const { body } = require('express-validator');

const validateArticle = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 500 }).withMessage('Title must be less than 500 characters'),
  body('content')
    .notEmpty().withMessage('Content is required'),
  body('excerpt')
    .optional()
    .isLength({ max: 1000 }).withMessage('Excerpt must be less than 1000 characters'),
  body('categoryId')
    .optional()
    .isUUID().withMessage('Category ID must be a valid UUID'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived']).withMessage('Status must be one of draft, published, or archived'),
  body('is_featured')
    .optional()
    .isBoolean().withMessage('is_featured must be a boolean'),
  body('seo_title')
    .optional()
    .isLength({ max: 60 }).withMessage('SEO Title must be less than 60 characters'),
  body('seo_description')
    .optional()
    .isLength({ max: 160 }).withMessage('SEO Description must be less than 160 characters'),
  body('seo_keywords')
    .optional()
    .isLength({ max: 500 }).withMessage('SEO Keywords must be less than 500 characters'),
  body('canonical_url')
    .optional()
    .isURL().withMessage('Canonical URL must be a valid URL'),
  body('meta_robots')
    .optional()
    .isLength({ max: 100 }).withMessage('Meta Robots must be less than 100 characters'),
];

module.exports = { validateArticle };
