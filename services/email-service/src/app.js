/**
 * Email Service - Express Application
 * 
 * This file sets up the Express application with:
 * - Minimal middleware configuration
 * - Health check endpoint
 * - Error handling
 * 
 * Note: This service is primarily a consumer, so it has minimal HTTP endpoints.
 * The application is exported and started in server.js
 */

const express = require('express');

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * JSON Body Parser
 * Parses incoming JSON requests
 */
app.use(express.json());

/**
 * Request Logger Middleware
 * Logs all incoming requests for debugging
 */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    service: 'Email Service',
    version: '1.0.0',
    status: 'running',
    type: 'consumer',
    endpoints: {
      healthCheck: 'GET /health',
    },
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Email Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * 404 Not Found Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
  console.error('[Express Error]:', err.message);
  console.error('[Express Error] Stack:', err.stack);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = app;
