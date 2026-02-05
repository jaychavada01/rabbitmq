/**
 * Order Service - Express Application
 * 
 * This file sets up the Express application with:
 * - Middleware configuration
 * - Route registration
 * - Error handling
 * 
 * The application is exported and started in server.js
 */

const express = require('express');
const orderRoutes = require('./routes/orderRoutes');

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * JSON Body Parser
 * Parses incoming JSON requests and makes data available in req.body
 */
app.use(express.json());

/**
 * URL-Encoded Body Parser
 * Parses URL-encoded data (form submissions)
 */
app.use(express.urlencoded({ extended: true }));

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
    service: 'Order Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      createOrder: 'POST /api/orders',
      healthCheck: 'GET /api/orders/health',
    },
  });
});

/**
 * Order routes
 * All order-related endpoints are prefixed with /api/orders
 */
app.use('/api/orders', orderRoutes);

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

/**
 * 404 Not Found Handler
 * Catches all requests that don't match any routes
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
 * Catches all errors thrown in the application
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
