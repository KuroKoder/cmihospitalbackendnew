const { SeoMeta } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await SeoMeta.bulkCreate([
      {
        model_type: 'Article',
        model_id: 'valid-article-uuid', // Ganti dengan UUID artikel yang valid
        seo_title: 'SEO Title for Article',
        seo_description: 'SEO Description for Article',
        seo_keywords: 'article, seo',
        canonical_url: 'https://example.com/article',
        meta_robots: 'index,follow',
      },
      // Tambahkan lebih banyak SEO meta sesuai kebutuhan
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await SeoMeta.destroy({ where: {}, truncate: true });
  }
};
