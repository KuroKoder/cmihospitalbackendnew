const { DataTypes } = require("sequelize");

class Doctor {
  static initModel(sequelize) {
    return sequelize.define(
      "Doctor",
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
        specialty: DataTypes.STRING,
        description: DataTypes.TEXT,
        image: DataTypes.TEXT,
        facebook_url: DataTypes.STRING,
        instagram_url: DataTypes.STRING,
        twitter_url: DataTypes.STRING,
        linkedin_url: DataTypes.STRING,
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
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
        tableName: "doctors",
        underscored: true,
        timestamps: false,
      }
    );
  }

  static associate(models) {
    // Jika ada relasi seperti "dokter bisa menulis artikel", bisa ditambahkan di sini
  }
}

module.exports = Doctor;
