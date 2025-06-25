const sequelize = require("../config/sequelize");

// Import semua model
const ArticleModel = require("./Article");
const CategoryModel = require("./Category");
const UserModel = require("./User");
const DoctorModel = require("./Doctor");
const PageModel = require("./Page");
const SeoMetaModel = require("./SeoMeta");

// Inisialisasi model
const Article = ArticleModel.initModel(sequelize);
const Category = CategoryModel.initModel(sequelize);
const User = UserModel.initModel(sequelize);
const Doctor = DoctorModel.initModel(sequelize);
const Page = PageModel.initModel(sequelize);
const SeoMeta = SeoMetaModel.initModel(sequelize);

// Simpan dalam satu objek agar bisa dikirim ke associate
const db = {
  sequelize,
  Article,
  Category,
  User,
  Doctor,
  Page,
  SeoMeta,
};

// Relasi antar model
ArticleModel.associate?.(db);
CategoryModel.associate?.(db);
UserModel.associate?.(db);
DoctorModel.associate?.(db);
PageModel.associate?.(db);
SeoMetaModel.associate?.(db);

module.exports = {
  models: db,
  sequelize,
};

