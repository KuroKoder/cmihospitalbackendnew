// server.js
require("dotenv").config();
const app = require("./src/app");
const sequelize = require("./src/config/sequelize");
require("./src/models"); // Ganti pool -> sequelize
const redis = require("./src/config/redis");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 5000;

// Sequelize connection test & sync models
async function connectDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // tambahkan { alter: true } jika mau auto update struktur
    logger.info("✅ Sequelize connected and models synchronized");
  } catch (error) {
    logger.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

// Redis connection
async function connectRedis() {
  try {
    await redis.connect();
    logger.info("✅ Redis connected successfully");
  } catch (error) {
    logger.warn("⚠️ Redis connection failed, continuing without cache:", error);
  }
}

// Graceful shutdown
const gracefulShutdown = (signal, server) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      await sequelize.close(); // tutup koneksi Sequelize
      logger.info("Sequelize connection closed");

      await redis.quit();
      logger.info("Redis connection closed");

      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  });
};

// Start server
async function startServer() {
  await connectDatabase();
  await connectRedis();

  const server = app.listen(PORT, () => {
    logger.info(
      `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
    );
  });

  // Handle graceful shutdown
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM", server));
  process.on("SIGINT", () => gracefulShutdown("SIGINT", server));

  return server;
}

startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
