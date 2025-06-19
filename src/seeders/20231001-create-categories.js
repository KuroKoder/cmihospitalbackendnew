const { Category } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Category.bulkCreate([
      {
        name: 'Health',
        slug: 'health',
        description: 'Articles related to health and wellness.',
        is_active: true,
        sort_order: 1,
        seo_title: 'Health Articles',
        seo_description: 'Explore our health articles.',
        seo_keywords: 'health, wellness',
      },
      // Tambahkan lebih banyak kategori sesuai kebutuhan
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Category.destroy({ where: {}, truncate: true });
  }
};
