const express = require('express');
const router = express.Router();
const { models } = require('../../models');
const AuthController = require('../../controllers/authController');
const AuthMiddleware = require('../../middleware/auth');

// Initialize controller and middleware
const authController = new AuthController(models);
const authMiddleware = new AuthMiddleware(models);

// Rate limiting middleware - 5 requests per 15 minutes for sensitive endpoints
const strictRateLimit = authMiddleware.rateLimit(15 * 60 * 1000, 5);
const normalRateLimit = authMiddleware.rateLimit(15 * 60 * 1000, 20);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', strictRateLimit, async (req, res) => {
  try {
    const result = await authController.register(req.body);
    
    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Register route error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', strictRateLimit, async (req, res) => {
  try {
    const result = await authController.login(req.body);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(401).json(result);
    }
  } catch (error) {
    console.error('Login route error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', normalRateLimit, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authController.refreshToken(refreshToken);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(401).json(result);
    }
  } catch (error) {
    console.error('Refresh token route error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authMiddleware.authenticate(), async (req, res) => {
  try {
    const result = await authController.logout();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Logout route error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify user email
 * @access  Public
 */
router.post('/verify-email', normalRateLimit, async (req, res) => {
  try {
    const { token } = req.body;
    const result = await authController.verifyEmail(token);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Verify email route error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', strictRateLimit, async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authController.forgotPassword(email);
    
    // Always return success for security (don't reveal if email exists)
    return res.status(200).json({
      success: true,
      message: 'Jika email terdaftar, link reset password akan dikirim'
    });
  } catch (error) {
    console.error('Forgot password route error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', strictRateLimit, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const result = await authController.resetPassword(token, newPassword);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Reset password route error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post('/change-password', authMiddleware.authenticate(), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await authController.changePassword(req.user.id, oldPassword, newPassword);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Change password route error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authMiddleware.authenticate(), async (req, res) => {
  try {
    const result = await authController.getProfile(req.user.id);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get profile route error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authMiddleware.authenticate(), async (req, res) => {
  try {
    const result = await authController.updateProfile(req.user.id, req.body);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Update profile route error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user info (quick endpoint)
 * @access  Private
 */
router.get('/me', authMiddleware.authenticate(), async (req, res) => {
  try {
    // Return user info from middleware (already attached to req.user)
    const userInfo = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      avatar: req.user.avatar,
      is_active: req.user.is_active,
      email_verified: req.user.email_verified,
      last_login: req.user.last_login
    };

    return res.status(200).json({
      success: true,
      data: userInfo,
      message: 'User info retrieved successfully'
    });
  } catch (error) {
    console.error('Get user info route error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/auth/validate-token
 * @desc    Validate if token is still valid
 * @access  Private
 */
router.post('/validate-token', authMiddleware.authenticate(), async (req, res) => {
  try {
    // If middleware passes, token is valid
    return res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        }
      },
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Validate token route error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Internal server error'
    });
  }
});

module.exports = router;