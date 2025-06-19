const { User } = require('../models');
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password123', 10); // Ganti dengan password yang diinginkan

    await User.bulkCreate([
      {
        email: 'john.doe@example.com',
        password: hashedPassword,
        name: 'John Doe',
        role: 'admin', // Role admin
        avatar: 'https://example.com/avatars/john.jpg',
        is_active: true,
        email_verified: true,
        last_login: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'jane.smith@example.com',
        password: hashedPassword,
        name: 'Jane Smith',
        role: 'editor', // Role editor
        avatar: 'https://example.com/avatars/jane.jpg',
        is_active: true,
        email_verified: false,
        last_login: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: 'alice.jones@example.com',
        password: hashedPassword,
        name: 'Alice Jones',
        role: 'user', // Role user
        avatar: 'https://example.com/avatars/alice.jpg',
        is_active: true,
        email_verified: false,
        last_login: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      // Tambahkan lebih banyak pengguna sesuai kebutuhan
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await User.destroy({ where: {}, truncate: true });
  }
};
