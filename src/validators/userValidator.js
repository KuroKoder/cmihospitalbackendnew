const { body, param, query } = require('express-validator');

// Validator untuk membuat user baru
const validateCreateUser = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must be less than 255 characters'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .isLength({ max: 255 }).withMessage('Password must be less than 255 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long')
    .isLength({ max: 255 }).withMessage('Name must be less than 255 characters')
    .trim(),
  body('role')
    .optional()
    .isIn(['admin', 'editor', 'user']).withMessage('Role must be one of admin, editor, or user'),
  body('avatar')
    .optional()
    .isURL().withMessage('Avatar must be a valid URL'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean'),
  body('email_verified')
    .optional()
    .isBoolean().withMessage('email_verified must be a boolean'),
];

// Validator untuk update user (PUT)
const validateUpdateUser = [
  param('id')
    .isUUID().withMessage('User ID must be a valid UUID'),
  body('email')
    .optional()
    .isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must be less than 255 characters'),
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    .isLength({ max: 255 }).withMessage('Password must be less than 255 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('name')
    .optional()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long')
    .isLength({ max: 255 }).withMessage('Name must be less than 255 characters')
    .trim(),
  body('role')
    .optional()
    .isIn(['admin', 'editor', 'user']).withMessage('Role must be one of admin, editor, or user'),
  body('avatar')
    .optional()
    .isURL().withMessage('Avatar must be a valid URL'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean'),
  body('email_verified')
    .optional()
    .isBoolean().withMessage('email_verified must be a boolean'),
];

// Validator untuk patch user (PATCH) - hanya field tertentu
const validatePatchUser = [
  param('id')
    .isUUID().withMessage('User ID must be a valid UUID'),
  body('name')
    .optional()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long')
    .isLength({ max: 255 }).withMessage('Name must be less than 255 characters')
    .trim(),
  body('avatar')
    .optional()
    .isURL().withMessage('Avatar must be a valid URL'),
  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean'),
  body('email_verified')
    .optional()
    .isBoolean().withMessage('email_verified must be a boolean'),
  body('last_login')
    .optional()
    .isISO8601().withMessage('last_login must be a valid date'),
];

// Validator untuk ID parameter
const validateUserId = [
  param('id')
    .isUUID().withMessage('User ID must be a valid UUID'),
];

// Validator untuk email query
const validateEmailQuery = [
  query('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail(),
];

// Validator untuk verifikasi password
const validateVerifyPassword = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// Validator untuk update password
const validateUpdatePassword = [
  param('id')
    .isUUID().withMessage('User ID must be a valid UUID'),
  body('oldPassword')
    .notEmpty().withMessage('Old password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
    .isLength({ max: 255 }).withMessage('New password must be less than 255 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
];

// Validator untuk delete multiple users
const validateDeleteMultiple = [
  body('userIds')
    .isArray({ min: 1 }).withMessage('userIds must be an array with at least one item')
    .custom((value) => {
      for (let id of value) {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
          throw new Error('All userIds must be valid UUIDs');
        }
      }
      return true;
    }),
];

// Validator untuk query parameters (pagination, filter, sort)
const validateUserQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .isLength({ max: 255 }).withMessage('Search term must be less than 255 characters')
    .trim(),
  query('role')
    .optional()
    .isIn(['admin', 'editor', 'user']).withMessage('Role must be one of admin, editor, or user'),
  query('is_active')
    .optional()
    .isIn(['true', 'false']).withMessage('is_active must be true or false'),
  query('sortBy')
    .optional()
    .isIn(['name', 'email', 'role', 'created_at', 'updated_at', 'last_login'])
    .withMessage('sortBy must be one of name, email, role, created_at, updated_at, last_login'),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC']).withMessage('sortOrder must be ASC or DESC'),
];

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validatePatchUser,
  validateUserId,
  validateEmailQuery,
  validateVerifyPassword,
  validateUpdatePassword,
  validateDeleteMultiple,
  validateUserQuery,
};