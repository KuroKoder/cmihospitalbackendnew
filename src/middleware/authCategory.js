//authCategory.js

const jwt = require('jsonwebtoken');
const { models } = require('../models');
const { User } = models;
const logger = require('../utils/logger');

// Middleware untuk verifikasi JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    console.log('User from DB:', user);


    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

// Middleware untuk verifikasi role admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Middleware untuk verifikasi role editor atau admin
const requireEditor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!['admin', 'editor'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Editor or admin access required'
    });
  }

  next();
};

// Middleware opsional untuk autentikasi (tidak wajib)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continue without authentication
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (user && user.is_active) {
      req.user = user;
      req.userId = user.id;
    }
    
    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireEditor,
  optionalAuth
};