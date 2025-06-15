// src/middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error("Error middleware:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
