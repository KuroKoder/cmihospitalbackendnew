const { body } = require('express-validator');

const validateDoctor = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 255 }).withMessage('Name must be less than 255 characters'),
  body('specialty')
    .optional()
    .isLength({ max: 255 }).withMessage('Specialty must be less than 255 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('image')
    .optional()
    .isURL().withMessage('Image must be a valid URL'),
  body('facebook_url')
    .optional()
    .isURL().withMessage('Facebook URL must be a valid URL'),
  body('instagram_url')
    .optional()
    .isURL().withMessage('Instagram URL must be a valid URL'),
  body('twitter_url')
    .optional()
    .isURL().withMessage('Twitter URL must be a valid URL'),
  body('linkedin_url')
    .optional()
    .isURL().withMessage('LinkedIn URL must be a valid URL'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean'),
];

module.exports = { validateDoctor };
