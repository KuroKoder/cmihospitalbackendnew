const { DataTypes } = require("sequelize");

class SeoMeta {
  static initModel(sequelize) {
    return sequelize.define(
      "SeoMeta",
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        model_type: {
          type: DataTypes.STRING, // Contoh: "Article", "Page", "Doctor", "Category"
          allowNull: false,
          validate: {
            isIn: [["Article", "Page", "Doctor", "Category", "Service"]] // Bisa ditambah sesuai kebutuhan
          }
        },
        model_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        seo_title: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        seo_description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        seo_keywords: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        canonical_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        meta_robots: {
          type: DataTypes.STRING(100),
          defaultValue: "index,follow",
        },
        schema_markup: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        open_graph_title: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        open_graph_description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        open_graph_image: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        twitter_card: {
          type: DataTypes.STRING(20),
          defaultValue: "summary_large_image",
          validate: {
            isIn: [["summary", "summary_large_image", "app", "player"]]
          }
        },
        twitter_title: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        twitter_description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        twitter_image: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        tableName: "seo_meta",
        underscored: true,
        timestamps: false,
        indexes: [
          {
            unique: true,
            fields: ['model_type', 'model_id']
          },
          {
            fields: ['model_type']
          }
        ]
      }
    );
  }

  static associate(models) {
    // Relasi polymorphic - SeoMeta bisa belong ke berbagai model
    
    // Relasi ke Article
    models.SeoMeta.belongsTo(models.Article, {
      foreignKey: "model_id",
      constraints: false,
      scope: {
        model_type: "Article"
      },
      as: "article"
    });

    // Jika nanti ada model lain seperti Page, Doctor, Category, bisa ditambahkan:
    // models.SeoMeta.belongsTo(models.Page, {
    //   foreignKey: "model_id",
    //   constraints: false,
    //   scope: {
    //     model_type: "Page"
    //   },
    //   as: "page"
    // });

    // models.SeoMeta.belongsTo(models.Doctor, {
    //   foreignKey: "model_id",
    //   constraints: false,
    //   scope: {
    //     model_type: "Doctor"
    //   },
    //   as: "doctor"
    // });

    // models.SeoMeta.belongsTo(models.Category, {
    //   foreignKey: "model_id",
    //   constraints: false,
    //   scope: {
    //     model_type: "Category"
    //   },
    //   as: "category"
    // });
  }

  // Instance method untuk mendapatkan model terkait
  async getRelatedModel() {
    const models = this.sequelize.models;
    
    switch (this.model_type) {
      case 'Article':
        return await models.Article.findByPk(this.model_id);
      case 'Page':
        return await models.Page?.findByPk(this.model_id);
      case 'Doctor':
        return await models.Doctor?.findByPk(this.model_id);
      case 'Category':
        return await models.Category?.findByPk(this.model_id);
      default:
        return null;
    }
  }

  // Static method untuk mendapatkan SEO meta berdasarkan model
  static async getByModel(modelType, modelId) {
    return await this.findOne({
      where: {
        model_type: modelType,
        model_id: modelId
      }
    });
  }

  // Static method untuk membuat atau update SEO meta
  static async upsertByModel(modelType, modelId, seoData) {
    const [seoMeta, created] = await this.findOrCreate({
      where: {
        model_type: modelType,
        model_id: modelId
      },
      defaults: {
        ...seoData,
        model_type: modelType,
        model_id: modelId
      }
    });

    if (!created) {
      await seoMeta.update(seoData);
    }

    return seoMeta;
  }
}

module.exports = SeoMeta;