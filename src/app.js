console.log('🔍 Mulai load app.js');

const express = require("express");
console.log('✅ Express loaded');

const cors = require("cors");
console.log('✅ CORS loaded');

const helmet = require("helmet");
console.log('✅ Helmet loaded');

const compression = require("compression");
console.log('✅ Compression loaded');

const morgan = require("morgan");
console.log('✅ Morgan loaded');

const rateLimit = require("express-rate-limit");
console.log('✅ Express-rate-limit loaded');

const slowDown = require("express-slow-down");
console.log('✅ Express-slow-down loaded');

console.log('🔍 Mulai load internal modules...');

const routes = require("./routes");
console.log('✅ Routes loaded');

const errorHandler = require("./middleware/errorHandler");
console.log('✅ Error handler loaded');

const logger = require("./utils/logger");
console.log('✅ Logger loaded');

console.log('🔍 Membuat Express app...');
const app = express();
console.log('✅ Express app created');

// Trust proxy
console.log('🔍 Setting trust proxy...');
app.set("trust proxy", 1);
console.log('✅ Trust proxy set');

// Security middleware
console.log('🔍 Setting up Helmet security...');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);
console.log('✅ Helmet security configured');

// CORS configuration
console.log('🔍 Setting up CORS...');
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://cmihospital.com", "https://www.cmihospital.com"]
        : ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
console.log('✅ CORS configured');

// Compression
console.log('🔍 Setting up compression...');
app.use(compression());
console.log('✅ Compression configured');

// Rate limiting
console.log('🔍 Setting up rate limiting...');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
console.log('✅ Rate limiter created');

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,
  delayMs: () => 500,
});
console.log('✅ Speed limiter created');

if (process.env.NODE_ENV === "production") {
  console.log('🔍 Production mode - applying rate limiting...');
  app.use("/api/", limiter);
  app.use("/api/", speedLimiter);
  console.log('✅ Rate limiting applied');
} else {
  console.log('ℹ️ Development mode - rate limiting disabled');
}

// Body parsing
console.log('🔍 Setting up body parsing...');
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
console.log('✅ Body parsing configured');

// Logging
console.log('🔍 Setting up Morgan logging...');
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);
console.log('✅ Morgan logging configured');

// Static files
console.log('🔍 Setting up static files...');
app.use("/uploads", express.static("uploads"));
console.log('✅ Static files configured');

// Health check
console.log('🔍 Setting up health check endpoint...');
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
console.log('✅ Health check endpoint configured');

// API routes
console.log('🔍 Setting up API routes...');
app.use("/api", routes);
console.log('✅ API routes configured');

// 404 handler
console.log('🔍 Setting up 404 handler...');
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});
console.log('✅ 404 handler configured');

// Error handling
console.log('🔍 Setting up error handler...');
app.use(errorHandler);
console.log('✅ Error handler configured');

console.log('🎉 App.js berhasil dimuat sepenuhnya!');
module.exports = app;