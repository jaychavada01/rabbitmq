const express = require("express");

// EXPRESS APP SETUP
const app = express();

// MIDDLEWARE
app.use(express.json());

/**
 * Request Logger Middleware
 * Logs all incoming requests for debugging
 */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ROUTES

// ** health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "Email Service",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;
