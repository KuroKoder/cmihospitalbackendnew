const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

class UserController {
  constructor(models) {
    this.User = models.User;
  }

  // CREATE - Membuat user baru
  async createUser(userData) {
    try {
      // Hash password sebelum menyimpan
      if (userData.password) {
        const saltRounds = 10;
        userData.password = await bcrypt.hash(userData.password, saltRounds);
      }

      const user = await this.User.create(userData);
      
      // Hapus password dari response
      const userResponse = user.toJSON();
      delete userResponse.password;
      
      return {
        success: true,
        data: userResponse,
        message: 'User berhasil dibuat'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Gagal membuat user'
      };
    }
  }

  // READ - Mendapatkan semua user dengan pagination dan filter
  async getAllUsers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        role = '',
        is_active = '',
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = options;

      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (role) {
        whereClause.role = role;
      }
      
      if (is_active !== '') {
        whereClause.is_active = is_active === 'true';
      }

      const { count, rows } = await this.User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        order: [[sortBy, sortOrder]],
        limit: parseInt(limit),
        offset: offset,
        include: [
          {
            association: 'articles',
            attributes: ['id', 'title', 'created_at']
          }
        ]
      });

      return {
        success: true,
        data: {
          users: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        },
        message: 'Data user berhasil diambil'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Gagal mengambil data user'
      };
    }
  }

  // READ - Mendapatkan user berdasarkan ID
  async getUserById(id) {
    try {
      const user = await this.User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            association: 'articles',
            attributes: ['id', 'title', 'created_at']
          }
        ]
      });

      if (!user) {
        return {
          success: false,
          message: 'User tidak ditemukan'
        };
      }

      return {
        success: true,
        data: user,
        message: 'Data user berhasil diambil'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Gagal mengambil data user'
      };
    }
  }

  // READ - Mendapatkan user berdasarkan email
  async getUserByEmail(email) {
    try {
      const user = await this.User.findOne({
        where: { email },
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return {
          success: false,
          message: 'User tidak ditemukan'
        };
      }

      return {
        success: true,
        data: user,
        message: 'Data user berhasil diambil'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Gagal mengambil data user'
      };
    }
  }

  // UPDATE - Memperbarui user
  async updateUser(id, updateData) {
    try {
      const user = await this.User.findByPk(id);
      
      if (!user) {
        return {
          success: false,
          message: 'User tidak ditemukan'
        };
      }

      // Jika ada password baru, hash terlebih dahulu
      if (updateData.password) {
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);
      }

      // Update timestamp
      updateData.updated_at = new Date();

      await user.update(updateData);
      
      // Ambil data user yang sudah diupdate tanpa password
      const updatedUser = await this.User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      return {
        success: true,
        data: updatedUser,
        message: 'User berhasil diperbarui'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Gagal memperbarui user'
      };
    }
  }

  // UPDATE - Memperbarui sebagian data user (PATCH)
  async patchUser(id, patchData) {
    try {
      const user = await this.User.findByPk(id);
      
      if (!user) {
        return {
          success: false,
          message: 'User tidak ditemukan'
        };
      }

      // Validasi field yang diizinkan untuk patch
      const allowedFields = ['name', 'avatar', 'is_active', 'email_verified', 'last_login'];
      const filteredData = {};
      
      allowedFields.forEach(field => {
        if (patchData.hasOwnProperty(field)) {
          filteredData[field] = patchData[field];
        }
      });

      if (Object.keys(filteredData).length === 0) {
        return {
          success: false,
          message: 'Tidak ada field yang valid untuk diupdate'
        };
      }

      filteredData.updated_at = new Date();
      await user.update(filteredData);
      
      const updatedUser = await this.User.findByPk(id, {
        attributes: { exclude: ['password'] }
      });

      return {
        success: true,
        data: updatedUser,
        message: 'User berhasil diperbarui'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Gagal memperbarui user'
      };
    }
  }

  // DELETE - Menghapus user (soft delete)
  async deactivateUser(id) {
    try {
      const user = await this.User.findByPk(id);
      
      if (!user) {
        return {
          success: false,
          message: 'User tidak ditemukan'
        };
      }

      await user.update({ 
        is_active: false,
        updated_at: new Date()
      });

      return {
        success: true,
        message: 'User berhasil dinonaktifkan'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Gagal menonaktifkan user'
      };
    }
  }

  // DELETE - Menghapus user permanent
  async deleteUser(id) {
    try {
      const user = await this.User.findByPk(id);
      
      if (!user) {
        return {
          success: false,
          message: 'User tidak ditemukan'
        };
      }

      await user.destroy();

      return {
        success: true,
        message: 'User berhasil dihapus permanent'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Gagal menghapus user'
      };
    }
  }

  // DELETE - Menghapus multiple users
  async deleteMultipleUsers(userIds) {
    try {
      const deletedCount = await this.User.destroy({
        where: {
          id: {
            [Op.in]: userIds
          }
        }
      });

      return {
        success: true,
        data: { deletedCount },
        message: `${deletedCount} user berhasil dihapus`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Gagal menghapus multiple users'
      };
    }
  }

  // UTILITY - Verifikasi password
  async verifyPassword(email, password) {
    try {
      const user = await this.User.findOne({
        where: { email }
      });

      if (!user) {
        return {
          success: false,
          message: 'User tidak ditemukan'
        };
      }

      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        return {
          success: false,
          message: 'Password salah'
        };
      }

      // Update last login
      await user.update({ last_login: new Date() });

      // Return user data tanpa password
      const userData = user.toJSON();
      delete userData.password;

      return {
        success: true,
        data: userData,
        message: 'Login berhasil'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Gagal verifikasi password'
      };
    }
  }

  // UTILITY - Update password
  async updatePassword(id, oldPassword, newPassword) {
    try {
      const user = await this.User.findByPk(id);
      
      if (!user) {
        return {
          success: false,
          message: 'User tidak ditemukan'
        };
      }

      // Verifikasi password lama
      const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
      
      if (!isValidOldPassword) {
        return {
          success: false,
          message: 'Password lama salah'
        };
      }

      // Hash password baru
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      await user.update({ 
        password: hashedNewPassword,
        updated_at: new Date()
      });

      return {
        success: true,
        message: 'Password berhasil diperbarui'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Gagal memperbarui password'
      };
    }
  }

  // UTILITY - Get user statistics
  async getUserStats() {
    try {
      const totalUsers = await this.User.count();
      const activeUsers = await this.User.count({ where: { is_active: true } });
      const verifiedUsers = await this.User.count({ where: { email_verified: true } });
      
      const usersByRole = await this.User.findAll({
        attributes: [
          'role',
          [this.User.sequelize.fn('COUNT', this.User.sequelize.col('id')), 'count']
        ],
        group: ['role']
      });

      return {
        success: true,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          verifiedUsers,
          unverifiedUsers: totalUsers - verifiedUsers,
          usersByRole: usersByRole.map(item => ({
            role: item.role,
            count: parseInt(item.dataValues.count)
          }))
        },
        message: 'Statistik user berhasil diambil'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Gagal mengambil statistik user'
      };
    }
  }
}

module.exports = UserController;