require('dotenv').config();
const app = require('./src/app');
const pool = require('./src/config/database');
const redis = require('./src/config/redis');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Database connection test
async function connectDatabase() {
  try {
    await pool.query('SELECT NOW()');
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Redis connection
async function connectRedis() {
  try {
    await redis.connect();
    logger.info('✅ Redis connected successfully');
  } catch (error) {
    logger.warn('⚠️ Redis connection failed, continuing without cache:', error);
  }
}

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      await pool.end();
      logger.info('Database pool closed');
      
      await redis.quit();
      logger.info('Redis connection closed');
      
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

// Start server
async function startServer() {
  await connectDatabase();
  await connectRedis();
  
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  return server;
}

startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});