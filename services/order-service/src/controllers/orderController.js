/**
 * Order Controller
 * 
 * This controller handles all order-related HTTP requests.
 * 
 * Responsibilities:
 * - Validate incoming order data
 * - Publish order events to RabbitMQ
 * - Return appropriate HTTP responses
 * - Handle errors gracefully
 */

const { publishMessage } = require('../rabbitmq/publisher');
const {
  EXCHANGES,
  QUEUES,
  ROUTING_KEYS,
} = require('../rabbitmq/constants');

// ============================================================================
// CONTROLLER FUNCTIONS
// ============================================================================

/**
 * Create a new order
 * 
 * This endpoint:
 * 1. Validates the order data
 * 2. Publishes an order.created event to RabbitMQ
 * 3. Returns success response to client
 * 
 * @route POST /api/orders
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * 
 * @example
 * POST /api/orders
 * {
 *   "orderId": "ORD-001",
 *   "customerEmail": "customer@example.com",
 *   "items": ["Product A", "Product B"],
 *   "total": 99.99
 * }
 */
async function createOrder(req, res) {
  try {
    // ========================================================================
    // STEP 1: Extract and Validate Order Data
    // ========================================================================
    const { orderId, customerEmail, items, total } = req.body;

    // Basic validation
    if (!orderId || !customerEmail || !items || !total) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, customerEmail, items, total',
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items must be a non-empty array',
      });
    }

    if (typeof total !== 'number' || total <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Total must be a positive number',
      });
    }

    // Email validation (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    console.log('[Order Controller] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Order Controller] 📦 New order received');
    console.log('[Order Controller] Order ID:', orderId);
    console.log('[Order Controller] Customer Email:', customerEmail);
    console.log('[Order Controller] Items:', items);
    console.log('[Order Controller] Total:', total);
    console.log('[Order Controller] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ========================================================================
    // STEP 2: Prepare Message Payload
    // ========================================================================
    const orderMessage = {
      orderId,
      customerEmail,
      items,
      total,
      createdAt: new Date().toISOString(),
      eventType: 'order.created',
    };

    // ========================================================================
    // STEP 3: Publish Message to RabbitMQ
    // ========================================================================
    await publishMessage(
      EXCHANGES.ORDER_EXCHANGE,
      QUEUES.EMAIL_QUEUE,
      ROUTING_KEYS.ORDER_CREATED,
      orderMessage
    );

    console.log('[Order Controller] ✓ Order event published to RabbitMQ');

    // ========================================================================
    // STEP 4: Return Success Response
    // ========================================================================
    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId,
        status: 'pending',
        message: 'Order confirmation email will be sent shortly',
      },
    });
  } catch (error) {
    // ========================================================================
    // ERROR HANDLING
    // ========================================================================
    console.error('[Order Controller] ✗ Error creating order:', error.message);
    console.error('[Order Controller] Stack trace:', error.stack);

    return res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.message,
    });
  }
}

/**
 * Health check endpoint
 * 
 * @route GET /api/orders/health
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function healthCheck(req, res) {
  return res.status(200).json({
    success: true,
    service: 'Order Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  createOrder,
  healthCheck,
};
