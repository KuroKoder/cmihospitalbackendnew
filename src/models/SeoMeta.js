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
          type: DataTypes.STRING, // Contoh: "Article", "Page", "Doctor"
          allowNull: false,
        },
        model_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        seo_title: DataTypes.STRING,
        seo_description: DataTypes.TEXT,
        seo_keywords: DataTypes.TEXT,
        canonical_url: DataTypes.STRING,
        meta_robots: {
          type: DataTypes.STRING,
          defaultValue: "index,follow",
        },
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
        tableName: "seo_meta",
        underscored: true,
        timestamps: false,
      }
    );
  }

  static associate(models) {
    // Jika ingin menggunakan relasi polymorphic, bisa pakai fungsi custom
    // Misalnya: model_type + model_id mengarah ke berbagai tabel
  }
}

module.exports = SeoMeta;
