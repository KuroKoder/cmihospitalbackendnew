const { DataTypes } = require("sequelize");

class Article {
  static initModel(sequelize) {
    return sequelize.define(
      "Article",
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        title: {
          type: DataTypes.STRING(500),
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(500),
          unique: true,
          allowNull: false,
        },
        excerpt: DataTypes.TEXT,
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        featured_image: DataTypes.TEXT,
        authorId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        categoryId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        status: {
          type: DataTypes.STRING(20),
          defaultValue: "draft",
          validate: {
            isIn: [["draft", "published", "archived"]],
          },
        },
        is_featured: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        view_count: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        reading_time: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        published_at: DataTypes.DATE,
        seo_title: DataTypes.STRING,
        seo_description: DataTypes.TEXT,
        seo_keywords: DataTypes.TEXT,
        meta_robots: {
          type: DataTypes.STRING(100),
          defaultValue: "index,follow",
        },
        canonical_url: DataTypes.TEXT,
        schema_markup: DataTypes.JSONB,
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
        tableName: "articles",
        underscored: true,
        timestamps: false,
      }
    );
  }

  static associate(models) {
    models.Article.belongsTo(models.User, {
      foreignKey: "authorId",
      as: "author",
    });
    models.Article.belongsTo(models.Category, {
      foreignKey: "categoryId",
      as: "category",
    });
  }
}

module.exports = Article;
