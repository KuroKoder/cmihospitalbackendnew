const { DataTypes } = require("sequelize");

class User {
  static initModel(sequelize) {
    return sequelize.define(
      "User",
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        role: {
          type: DataTypes.STRING,
          defaultValue: "user",
          validate: {
            isIn: [["admin", "editor", "user"]],
          },
        },
        avatar: DataTypes.TEXT,
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },
        email_verified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        last_login: DataTypes.DATE,
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
        tableName: "users",
        underscored: true,
        timestamps: true, // Changed to true
        createdAt: 'created_at', // Explicitly map timestamp fields
        updatedAt: 'updated_at'
      }
    );
  }

  static associate(models) {
    models.User.hasMany(models.Article, {
      foreignKey: "authorId",
      as: "articles",
    });
  }
}

module.exports = User;