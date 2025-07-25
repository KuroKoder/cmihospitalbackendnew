-- // Migration file: YYYYMMDDHHMMSS-enhance-seo-meta-table.js

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if table exists, if not create it
      const tableExists = await queryInterface.sequelize.query(
        "SELECT to_regclass('seo_meta') as exists",
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      if (!tableExists[0].exists) {
        // Create seo_meta table
        await queryInterface.createTable('seo_meta', {
          id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          model_type: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          model_id: {
            type: Sequelize.UUID,
            allowNull: false,
          },
          seo_title: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          seo_description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          seo_keywords: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          canonical_url: {
            type: Sequelize.STRING(500),
            allowNull: true,
          },
          meta_robots: {
            type: Sequelize.STRING(100),
            defaultValue: 'index,follow',
          },
          schema_markup: {
            type: Sequelize.JSONB,
            allowNull: true,
          },
          open_graph_title: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          open_graph_description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          open_graph_image: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          twitter_card: {
            type: Sequelize.STRING(20),
            defaultValue: 'summary_large_image',
          },
          twitter_title: {
            type: Sequelize.STRING(255),
            allowNull: true,
          },
          twitter_description: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          twitter_image: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
          },
          updated_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
          },
        }, { transaction });
      } else {
        // Add new columns if they don't exist
        const tableDescription = await queryInterface.describeTable('seo_meta');
        
        if (!tableDescription.open_graph_title) {
          await queryInterface.addColumn('seo_meta', 'open_graph_title', {
            type: Sequelize.STRING(255),
            allowNull: true,
          }, { transaction });
        }

        if (!tableDescription.open_graph_description) {
          await queryInterface.addColumn('seo_meta', 'open_graph_description', {
            type: Sequelize.TEXT,
            allowNull: true,
          }, { transaction });
        }

        if (!tableDescription.open_graph_image) {
          await queryInterface.addColumn('seo_meta', 'open_graph_image', {
            type: Sequelize.TEXT,
            allowNull: true,
          }, { transaction });
        }

        if (!tableDescription.twitter_card) {
          await queryInterface.addColumn('seo_meta', 'twitter_card', {
            type: Sequelize.STRING(20),
            defaultValue: 'summary_large_image',
          }, { transaction });
        }

        if (!tableDescription.twitter_title) {
          await queryInterface.addColumn('seo_meta', 'twitter_title', {
            type: Sequelize.STRING(255),
            allowNull: true,
          }, { transaction });
        }

        if (!tableDescription.twitter_description) {
          await queryInterface.addColumn('seo_meta', 'twitter_description', {
            type: Sequelize.TEXT,
            allowNull: true,
          }, { transaction });
        }

        if (!tableDescription.twitter_image) {
          await queryInterface.addColumn('seo_meta', 'twitter_image', {
            type: Sequelize.TEXT,
            allowNull: true,
          }, { transaction });
        }
      }

      // Create indexes
      await queryInterface.addIndex('seo_meta', {
        fields: ['model_type', 'model_id'],
        unique: true,
        name: 'seo_meta_model_unique_idx'
      }, { transaction });

      await queryInterface.addIndex('seo_meta', {
        fields: ['model_type'],
        name: 'seo_meta_model_type_idx'
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove indexes
      await queryInterface.removeIndex('seo_meta', 'seo_meta_model_unique_idx', { transaction });
      await queryInterface.removeIndex('seo_meta', 'seo_meta_model_type_idx', { transaction });

      // Remove new columns
      const tableDescription = await queryInterface.describeTable('seo_meta');
      
      if (tableDescription.open_graph_title) {
        await queryInterface.removeColumn('seo_meta', 'open_graph_title', { transaction });
      }

      if (tableDescription.open_graph_description) {
        await queryInterface.removeColumn('seo_meta', 'open_graph_description', { transaction });
      }

      if (tableDescription.open_graph_image) {
        await queryInterface.removeColumn('seo_meta', 'open_graph_image', { transaction });
      }

      if (tableDescription.twitter_card) {
        await queryInterface.removeColumn('seo_meta', 'twitter_card', { transaction });
      }

      if (tableDescription.twitter_title) {
        await queryInterface.removeColumn('seo_meta', 'twitter_title', { transaction });
      }

      if (tableDescription.twitter_description) {
        await queryInterface.removeColumn('seo_meta', 'twitter_description', { transaction });
      }

      if (tableDescription.twitter_image) {
        await queryInterface.removeColumn('seo_meta', 'twitter_image', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};