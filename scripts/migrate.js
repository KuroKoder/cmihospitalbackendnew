// scripts/migrate.js
const { sequelize } = require("../src/models");

(async () => {
  try {
    await sequelize.sync({ alter: true }); // Bisa pakai { force: true } jika ingin reset semua tabel
    console.log("✅ Migration completed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
})();
