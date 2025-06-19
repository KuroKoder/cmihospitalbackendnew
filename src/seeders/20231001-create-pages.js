const { Page } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Page.bulkCreate([
      {
        title: 'About Us',
        slug: 'about-us',
        content: 'We are a healthcare provider dedicated to...',
        status: 'published',
        seo_title: 'About Us - Healthcare Provider',
        seo_description: 'Learn more about our healthcare services.',
      },
      // Tambahkan lebih banyak halaman sesuai kebutuhan
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Page.destroy({ where: {}, truncate: true });
  }
};
