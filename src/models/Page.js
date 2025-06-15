const { DataTypes } = require("sequelize");

class Page {
  static initModel(sequelize) {
    return sequelize.define(
      "Page",
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        content: DataTypes.TEXT,
        status: {
          type: DataTypes.STRING,
          defaultValue: "draft",
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
        tableName: "pages",
        underscored: true,
        timestamps: false,
      }
    );
  }

  static associate(models) {
    // Bisa dikaitkan dengan SEO jika dibutuhkan
  }
}

module.exports = Page;
