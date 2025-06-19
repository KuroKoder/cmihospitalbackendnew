const { body } = require('express-validator');

const validateSeoMeta = [
  body('model_type')
    .notEmpty().withMessage('Model type is required')
    .isLength({ max: 50 }).withMessage('Model type must be less than 50 characters'),
  body('model_id')
    .notEmpty().withMessage('Model ID is required')
    .isUUID().withMessage('Model ID must be a valid UUID'),
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

module.exports = { validateSeoMeta };
