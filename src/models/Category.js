const { DataTypes } = require("sequelize");

class Category {
  static initModel(sequelize) {
    return sequelize.define(
      "Category",
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: false,
        },
        description: DataTypes.TEXT,
        image: DataTypes.TEXT,
        parent_id: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        sort_order: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        seo_title: DataTypes.STRING,
        seo_description: DataTypes.TEXT,
        seo_keywords: DataTypes.TEXT,
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
        tableName: "categories",
        underscored: true,
        timestamps: false,
      }
    );
  }

  static associate(models) {
    models.Category.hasMany(models.Article, {
      foreignKey: "categoryId",
      as: "articles",
    });
  }
}

module.exports = Category;
