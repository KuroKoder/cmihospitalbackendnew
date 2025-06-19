const { body } = require('express-validator');

const validatePage = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 255 }).withMessage('Title must be less than 255 characters'),
  body('slug')
    .notEmpty().withMessage('Slug is required')
    .isLength({ max: 255 }).withMessage('Slug must be less than 255 characters'),
  body('content')
    .optional()
    .isLength({ max: 10000 }).withMessage('Content must be less than 10000 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'published']).withMessage('Status must be either draft or published'),
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

module.exports = { validatePage };
