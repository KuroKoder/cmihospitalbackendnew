'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Migrate SEO data to seo_meta
      await queryInterface.sequelize.query(`
        INSERT INTO seo_meta (
          id,
          model_type,
          model_id,
          seo_title,
          seo_description,
          seo_keywords,
          canonical_url,
          meta_robots,
          schema_markup,
          created_at,
          updated_at
        )
        SELECT 
          gen_random_uuid(),
          'Article',
          id,
          seo_title,
          seo_description,
          seo_keywords,
          canonical_url,
          meta_robots,
          schema_markup,
          created_at,
          updated_at
        FROM articles 
        WHERE seo_title IS NOT NULL 
           OR seo_description IS NOT NULL 
           OR seo_keywords IS NOT NULL 
           OR canonical_url IS NOT NULL 
           OR meta_robots != 'index,follow'
           OR schema_markup IS NOT NULL
      `, { transaction });

      // 2. Remove columns from articles
      await queryInterface.removeColumn('articles', 'seo_title', { transaction });
      await queryInterface.removeColumn('articles', 'seo_description', { transaction });
      await queryInterface.removeColumn('articles', 'seo_keywords', { transaction });
      await queryInterface.removeColumn('articles', 'canonical_url', { transaction });
      await queryInterface.removeColumn('articles', 'meta_robots', { transaction });
      await queryInterface.removeColumn('articles', 'schema_markup', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Add columns back to articles
      await queryInterface.addColumn('articles', 'seo_title', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('articles', 'seo_description', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('articles', 'seo_keywords', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('articles', 'canonical_url', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('articles', 'meta_robots', {
        type: Sequelize.STRING(100),
        defaultValue: 'index,follow'
      }, { transaction });

      await queryInterface.addColumn('articles', 'schema_markup', {
        type: Sequelize.JSONB,
        allowNull: true
      }, { transaction });

      // 2. Restore data from seo_meta
      await queryInterface.sequelize.query(`
        UPDATE articles 
        SET 
          seo_title = sm.seo_title,
          seo_description = sm.seo_description,
          seo_keywords = sm.seo_keywords,
          canonical_url = sm.canonical_url,
          meta_robots = sm.meta_robots,
          schema_markup = sm.schema_markup
        FROM seo_meta sm 
        WHERE sm.model_type = 'Article' 
          AND sm.model_id = articles.id
      `, { transaction });

      // 3. Cleanup seo_meta
      await queryInterface.sequelize.query(`
        DELETE FROM seo_meta WHERE model_type = 'Article'
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
