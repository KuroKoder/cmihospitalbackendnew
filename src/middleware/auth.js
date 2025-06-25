const jwt = require('jsonwebtoken');

class AuthMiddleware {
  constructor(models) {
    this.User = models.User;
    this.JWT_SECRET = process.env.JWT_SECRET;
  }

  authenticate() {
    return async (req, res, next) => {
      try {
        // Get token from header
        const authHeader = req.headers.authorization;
        console.log('🔍 Auth header received:', authHeader);
        
        const token = authHeader && authHeader.split(' ')[1];
        console.log('🔍 Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');

        if (!token) {
          console.log('❌ No token provided');
          return res.status(401).json({
            success: false,
            error: 'Access token diperlukan',
            message: 'Unauthorized'
          });
        }

        // Verify token
        console.log('🔍 JWT_SECRET being used:', this.JWT_SECRET ? 'Available' : 'Missing');
        
        const decoded = jwt.verify(token, this.JWT_SECRET, {
          issuer: 'your-app-name',
          audience: 'your-app-users'
        });
        
        console.log('✅ Token verified successfully');
        console.log('🔍 Decoded token payload:', {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          iat: decoded.iat,
          exp: decoded.exp
        });

        // Check if user still exists and is active
        console.log('🔍 Searching for user with ID:', decoded.id);
        console.log('🔍 User ID type:', typeof decoded.id);
        
        const user = await this.User.findByPk(decoded.id, {
          attributes: { exclude: ['password'] }
        });

        console.log('🔍 User search result:', user ? 'Found' : 'Not found');
        
        if (user) {
          console.log('✅ User found:', {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            is_active: user.is_active
          });
        } else {
          console.log('❌ User not found in database');
          
          // Additional debugging - try to find user with different ID types
          console.log('🔍 Trying to find user with string ID...');
          const userByString = await this.User.findByPk(String(decoded.id));
          console.log('🔍 User found by string ID:', userByString ? 'Yes' : 'No');
          
          console.log('🔍 Trying to find user with number ID...');
          const userByNumber = await this.User.findByPk(Number(decoded.id));
          console.log('🔍 User found by number ID:', userByNumber ? 'Yes' : 'No');
          
          // Try to list some users to check if database connection is working
          console.log('🔍 Testing database connection...');
          const userCount = await this.User.count();
          console.log('🔍 Total users in database:', userCount);
          
          return res.status(401).json({
            success: false,
            error: 'User tidak ditemukan',
            message: 'Invalid token - user not found'
          });
        }

        if (!user.is_active) {
          console.log('❌ User found but not active');
          return res.status(401).json({
            success: false,
            error: 'Akun tidak aktif',
            message: 'Unauthorized'
          });
        }

        console.log('✅ Authentication successful for user:', user.email);
        req.user = user;
        next();

      } catch (error) {
        console.error('❌ Authentication error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        if (error.name === 'JsonWebTokenError') {
          console.log('❌ JWT Error: Invalid token format or signature');
          return res.status(401).json({
            success: false,
            error: 'Token tidak valid',
            message: 'Unauthorized'
          });
        }

        if (error.name === 'TokenExpiredError') {
          console.log('❌ JWT Error: Token expired');
          return res.status(401).json({
            success: false,
            error: 'Token expired',
            message: 'Unauthorized'
          });
        }

        return res.status(500).json({
          success: false,
          error: 'Server error',
          message: 'Internal Server Error'
        });
      }
    };
  }

  // Test method untuk debugging
  async testUserQuery(userId) {
    try {
      console.log('🧪 Testing direct user query...');
      console.log('🧪 User ID to search:', userId, typeof userId);
      
      const user = await this.User.findByPk(userId);
      console.log('🧪 Direct query result:', user ? 'Found' : 'Not found');
      
      if (user) {
        console.log('🧪 User data:', {
          id: user.id,
          email: user.email,
          is_active: user.is_active
        });
      }
      
      return user;
    } catch (error) {
      console.error('🧪 Test query error:', error);
      return null;
    }
  }

  // Rest of your existing methods...
  authorize(roles = []) {
    return (req, res, next) => {
      try {
        if (roles.length === 0) {
          return next();
        }

        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'User belum terautentikasi',
            message: 'Unauthorized'
          });
        }

        if (!roles.includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: 'Akses ditolak',
            message: 'Forbidden'
          });
        }

        next();
      } catch (error) {
        console.error('Authorization error:', error);
        return res.status(500).json({
          success: false,
          error: 'Server error',
          message: 'Internal Server Error'
        });
      }
    };
  }

  rateLimit(windowMs = 15 * 60 * 1000, maxRequests = 100) {
    const requests = new Map();

    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      const currentTime = Date.now();
      
      for (const [ip, data] of requests.entries()) {
        if (currentTime - data.firstRequest > windowMs) {
          requests.delete(ip);
        }
      }

      if (!requests.has(clientIP)) {
        requests.set(clientIP, {
          count: 1,
          firstRequest: currentTime
        });
        return next();
      }

      const clientData = requests.get(clientIP);
      
      if (currentTime - clientData.firstRequest > windowMs) {
        requests.set(clientIP, {
          count: 1,
          firstRequest: currentTime
        });
        return next();
      }

      if (clientData.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Terlalu banyak permintaan',
          message: 'Rate limit exceeded'
        });
      }

      clientData.count++;
      next();
    };
  }
}

module.exports = AuthMiddleware;