'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tambah kolom twitter_card jika belum ada
    await queryInterface.addColumn('seo_meta', 'twitter_card', {
      type: Sequelize.STRING(50),
      allowNull: true,
      defaultValue: 'summary_large_image',
    });

    await queryInterface.addColumn('seo_meta', 'twitter_title', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('seo_meta', 'twitter_description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('seo_meta', 'twitter_image', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    await queryInterface.addColumn('seo_meta', 'open_graph_title', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('seo_meta', 'open_graph_description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('seo_meta', 'open_graph_image', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    // Update nilai default jika null
    await queryInterface.sequelize.query(`
      UPDATE seo_meta
      SET twitter_card = 'summary_large_image'
      WHERE twitter_card IS NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('seo_meta', 'twitter_card');
    await queryInterface.removeColumn('seo_meta', 'twitter_title');
    await queryInterface.removeColumn('seo_meta', 'twitter_description');
    await queryInterface.removeColumn('seo_meta', 'twitter_image');
    await queryInterface.removeColumn('seo_meta', 'open_graph_title');
    await queryInterface.removeColumn('seo_meta', 'open_graph_description');
    await queryInterface.removeColumn('seo_meta', 'open_graph_image');
  }
};
