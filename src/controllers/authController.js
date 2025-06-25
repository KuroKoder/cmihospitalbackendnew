const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

class AuthController {
  constructor(models) {
    this.User = models.User;
    this.JWT_SECRET = process.env.JWT_SECRET ;
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
    this.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
  }

  // Generate JWT Token
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: 'your-app-name',
      audience: 'your-app-users'
    });
  }

  // Generate Refresh Token
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'your-app-name',
      audience: 'your-app-users'
    });
  }

  // Verify JWT Token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        issuer: 'your-app-name',
        audience: 'your-app-users'
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // REGISTER - Registrasi user baru
  async register(userData) {
    try {
      const { email, password, name, role = 'user' } = userData;

      // Validasi input
      if (!email || !password || !name) {
        return {
          success: false,
          error: 'Email, password, dan name harus diisi',
          message: 'Data tidak lengkap'
        };
      }

      // Validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: 'Format email tidak valid',
          message: 'Email tidak valid'
        };
      }

      // Validasi password strength
      if (password.length < 6) {
        return {
          success: false,
          error: 'Password minimal 6 karakter',
          message: 'Password terlalu pendek'
        };
      }

      // Check apakah email sudah terdaftar
      const existingUser = await this.User.findOne({ where: { email } });
      if (existingUser) {
        return {
          success: false,
          error: 'Email sudah terdaftar',
          message: 'Email sudah digunakan'
        };
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await this.User.create({
        email,
        password: hashedPassword,
        name,
        // role: role === 'admin' ? 'user' : role, // Prevent admin creation via register
        role,
        is_active: true,
        email_verified: false
      });

      // Generate tokens
      const accessToken = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Prepare response data
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        is_active: user.is_active,
        email_verified: user.email_verified,
        created_at: user.created_at
      };

      return {
        success: true,
        data: {
          user: userResponse,
          tokens: {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: this.JWT_EXPIRES_IN
          }
        },
        message: 'Registrasi berhasil'
      };

    } catch (error) {
      console.error('Error during registration:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal melakukan registrasi'
      };
    }
  }

  // LOGIN - Login user
  async login(credentials) {
    try {
      const { email, password, rememberMe = false } = credentials;

      // Validasi input
      if (!email || !password) {
        return {
          success: false,
          error: 'Email dan password harus diisi',
          message: 'Data tidak lengkap'
        };
      }

      // Find user by email
      const user = await this.User.findOne({
        where: { email }
      });

      if (!user) {
        return {
          success: false,
          error: 'Email atau password salah',
          message: 'Kredensial tidak valid'
        };
      }

      // Check if user is active
      if (!user.is_active) {
        return {
          success: false,
          error: 'Akun tidak aktif',
          message: 'Akun telah dinonaktifkan'
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Email atau password salah',
          message: 'Kredensial tidak valid'
        };
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Generate tokens with extended expiry if remember me
      const accessToken = rememberMe 
        ? jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            this.JWT_SECRET,
            { expiresIn: '30d' }
          )
        : this.generateToken(user);

      const refreshToken = this.generateRefreshToken(user);

      // Prepare response data
      const userResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        is_active: user.is_active,
        email_verified: user.email_verified,
        last_login: user.last_login
      };

      return {
        success: true,
        data: {
          user: userResponse,
          tokens: {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn: rememberMe ? '30d' : this.JWT_EXPIRES_IN
          }
        },
        message: 'Login berhasil'
      };

    } catch (error) {
      console.error('Error during login:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal melakukan login'
      };
    }
  }

  // REFRESH TOKEN - Refresh access token
  async refreshToken(refreshToken) {
    try {
      if (!refreshToken) {
        return {
          success: false,
          error: 'Refresh token diperlukan',
          message: 'Token tidak valid'
        };
      }

      // Verify refresh token
      const decoded = this.verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        return {
          success: false,
          error: 'Invalid token type',
          message: 'Token tidak valid'
        };
      }

      // Find user
      const user = await this.User.findByPk(decoded.id);
      if (!user || !user.is_active) {
        return {
          success: false,
          error: 'User tidak ditemukan atau tidak aktif',
          message: 'Token tidak valid'
        };
      }

      // Generate new tokens
      const newAccessToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        success: true,
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            tokenType: 'Bearer',
            expiresIn: this.JWT_EXPIRES_IN
          }
        },
        message: 'Token berhasil diperbarui'
      };

    } catch (error) {
      console.error('Error refreshing token:', error);
      return {
        success: false,
        error: 'Token tidak valid atau expired',
        message: 'Gagal memperbarui token'
      };
    }
  }

  // LOGOUT - Logout user (client-side token removal)
  async logout() {
    try {
      // Since JWT is stateless, logout is handled on client side
      // But we can log this action or add token to blacklist if needed
      return {
        success: true,
        message: 'Logout berhasil'
      };
    } catch (error) {
      console.error('Error during logout:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal melakukan logout'
      };
    }
  }

  // VERIFY EMAIL - Verifikasi email user
  async verifyEmail(token) {
    try {
      const decoded = this.verifyToken(token);
      
      const user = await this.User.findByPk(decoded.id);
      if (!user) {
        return {
          success: false,
          error: 'User tidak ditemukan',
          message: 'Token tidak valid'
        };
      }

      await user.update({ email_verified: true });

      return {
        success: true,
        message: 'Email berhasil diverifikasi'
      };

    } catch (error) {
      console.error('Error verifying email:', error);
      return {
        success: false,
        error: 'Token tidak valid atau expired',
        message: 'Gagal verifikasi email'
      };
    }
  }

  // FORGOT PASSWORD - Request password reset
  async forgotPassword(email) {
    try {
      const user = await this.User.findOne({ where: { email } });
      
      if (!user) {
        // Don't reveal if email exists or not for security
        return {
          success: true,
          message: 'Jika email terdaftar, link reset password akan dikirim'
        };
      }

      // Generate password reset token (valid for 1 hour)
      const resetToken = jwt.sign(
        { id: user.id, type: 'password_reset' },
        this.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // In production, send email with reset link
      // For now, just return the token
      return {
        success: true,
        data: { resetToken },
        message: 'Link reset password telah dikirim ke email Anda'
      };

    } catch (error) {
      console.error('Error in forgot password:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal memproses permintaan reset password'
      };
    }
  }

  // RESET PASSWORD - Reset password with token
  async resetPassword(token, newPassword) {
    try {
      if (!token || !newPassword) {
        return {
          success: false,
          error: 'Token dan password baru diperlukan',
          message: 'Data tidak lengkap'
        };
      }

      // Validasi password strength
      if (newPassword.length < 6) {
        return {
          success: false,
          error: 'Password minimal 6 karakter',
          message: 'Password terlalu pendek'
        };
      }

      // Verify reset token
      const decoded = this.verifyToken(token);
      
      if (decoded.type !== 'password_reset') {
        return {
          success: false,
          error: 'Invalid token type',
          message: 'Token tidak valid'
        };
      }

      // Find user
      const user = await this.User.findByPk(decoded.id);
      if (!user) {
        return {
          success: false,
          error: 'User tidak ditemukan',
          message: 'Token tidak valid'
        };
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await user.update({ password: hashedPassword });

      return {
        success: true,
        message: 'Password berhasil direset'
      };

    } catch (error) {
      console.error('Error resetting password:', error);
      return {
        success: false,
        error: 'Token tidak valid atau expired',
        message: 'Gagal reset password'
      };
    }
  }

  // CHANGE PASSWORD - Change password for authenticated user
  async changePassword(userId, oldPassword, newPassword) {
    try {
      if (!oldPassword || !newPassword) {
        return {
          success: false,
          error: 'Password lama dan baru diperlukan',
          message: 'Data tidak lengkap'
        };
      }

      // Validasi password strength
      if (newPassword.length < 6) {
        return {
          success: false,
          error: 'Password minimal 6 karakter',
          message: 'Password terlalu pendek'
        };
      }

      // Find user
      const user = await this.User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          error: 'User tidak ditemukan',
          message: 'User tidak valid'
        };
      }

      // Verify old password
      const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
      if (!isValidOldPassword) {
        return {
          success: false,
          error: 'Password lama salah',
          message: 'Password lama tidak valid'
        };
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await user.update({ password: hashedPassword });

      return {
        success: true,
        message: 'Password berhasil diubah'
      };

    } catch (error) {
      console.error('Error changing password:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal mengubah password'
      };
    }
  }

  // GET PROFILE - Get current user profile
  async getProfile(userId) {
    try {
      const user = await this.User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [
          {
            association: 'articles',
            attributes: ['id', 'title', 'created_at'],
            required: false
          }
        ]
      });

      if (!user) {
        return {
          success: false,
          error: 'User tidak ditemukan',
          message: 'User tidak valid'
        };
      }

      return {
        success: true,
        data: user,
        message: 'Profil berhasil diambil'
      };

    } catch (error) {
      console.error('Error getting profile:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal mengambil profil'
      };
    }
  }

  // UPDATE PROFILE - Update user profile
  async updateProfile(userId, updateData) {
    try {
      const user = await this.User.findByPk(userId);
      
      if (!user) {
        return {
          success: false,
          error: 'User tidak ditemukan',
          message: 'User tidak valid'
        };
      }

      // Filter allowed fields for profile update
      const allowedFields = ['name', 'avatar'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (updateData.hasOwnProperty(field)) {
          filteredData[field] = updateData[field];
        }
      });

      if (Object.keys(filteredData).length === 0) {
        return {
          success: false,
          error: 'Tidak ada field yang valid untuk diupdate',
          message: 'Data tidak valid'
        };
      }

      await user.update(filteredData);
      
      const updatedUser = await this.User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      return {
        success: true,
        data: updatedUser,
        message: 'Profil berhasil diperbarui'
      };

    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        error: error.message,
        message: 'Gagal memperbarui profil'
      };
    }
  }
}

module.exports = AuthController;