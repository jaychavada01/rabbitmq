/**
 * Order Routes
 * 
 * This file defines all HTTP routes for the Order Service.
 * Routes are mapped to controller functions.
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// ============================================================================
// ROUTES
// ============================================================================

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', orderController.createOrder);

/**
 * GET /api/orders/health
 * Health check endpoint
 */
router.get('/health', orderController.healthCheck);

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = router;
