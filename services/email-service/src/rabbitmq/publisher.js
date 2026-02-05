/**
 * RabbitMQ Publisher Utility
 * 
 * This module provides a reusable function for publishing messages to RabbitMQ.
 * 
 * Features:
 * - Automatic exchange and queue assertion
 * - JSON serialization with error handling
 * - Persistent message delivery
 * - Dead Letter Queue (DLQ) setup
 * - Queue binding to exchange
 * 
 * Usage:
 *   const { publishMessage } = require('./publisher');
 *   await publishMessage(exchange, queue, routingKey, message);
 */

const { getChannel } = require('./connection');
const {
  EXCHANGES,
  QUEUES,
  MESSAGE_OPTIONS,
} = require('./constants');

// ============================================================================
// PUBLISHER FUNCTIONS
// ============================================================================

/**
 * Publish a message to RabbitMQ
 * 
 * This function:
 * 1. Asserts the exchange exists (creates if not)
 * 2. Asserts the queue exists (creates if not)
 * 3. Asserts the DLX and DLQ exist
 * 4. Binds the queue to the exchange
 * 5. Serializes the message to JSON
 * 6. Publishes the message with persistence
 * 
 * @param {Object} exchangeConfig - Exchange configuration from constants
 * @param {Object} queueConfig - Queue configuration from constants
 * @param {string} routingKey - Routing key for message routing
 * @param {Object} message - Message payload (will be JSON serialized)
 * @returns {Promise<boolean>} - True if message was published successfully
 * 
 * @example
 * await publishMessage(
 *   EXCHANGES.ORDER_EXCHANGE,
 *   QUEUES.EMAIL_QUEUE,
 *   ROUTING_KEYS.ORDER_CREATED,
 *   { orderId: '123', email: 'user@example.com' }
 * );
 */
async function publishMessage(exchangeConfig, queueConfig, routingKey, message) {
  try {
    // Get channel instance
    const channel = await getChannel();

    // ========================================================================
    // STEP 1: Assert Dead Letter Exchange (DLX)
    // ========================================================================
    // The DLX receives messages that are rejected or fail processing
    await channel.assertExchange(
      EXCHANGES.DEAD_LETTER_EXCHANGE.name,
      EXCHANGES.DEAD_LETTER_EXCHANGE.type,
      EXCHANGES.DEAD_LETTER_EXCHANGE.options
    );
    console.log(`[Publisher] ✓ DLX asserted: ${EXCHANGES.DEAD_LETTER_EXCHANGE.name}`);

    // ========================================================================
    // STEP 2: Assert Dead Letter Queue (DLQ)
    // ========================================================================
    // Find the corresponding DLQ for this queue
    const dlqConfig = findDLQForQueue(queueConfig.name);
    if (dlqConfig) {
      await channel.assertQueue(dlqConfig.name, dlqConfig.options);
      console.log(`[Publisher] ✓ DLQ asserted: ${dlqConfig.name}`);

      // Bind DLQ to DLX
      const dlqRoutingKey = queueConfig.options.arguments['x-dead-letter-routing-key'];
      await channel.bindQueue(
        dlqConfig.name,
        EXCHANGES.DEAD_LETTER_EXCHANGE.name,
        dlqRoutingKey
      );
      console.log(
        `[Publisher] ✓ DLQ bound to DLX with routing key: ${dlqRoutingKey}`
      );
    }

    // ========================================================================
    // STEP 3: Assert Main Exchange
    // ========================================================================
    await channel.assertExchange(
      exchangeConfig.name,
      exchangeConfig.type,
      exchangeConfig.options
    );
    console.log(`[Publisher] ✓ Exchange asserted: ${exchangeConfig.name}`);

    // ========================================================================
    // STEP 4: Assert Main Queue
    // ========================================================================
    await channel.assertQueue(queueConfig.name, queueConfig.options);
    console.log(`[Publisher] ✓ Queue asserted: ${queueConfig.name}`);

    // ========================================================================
    // STEP 5: Bind Queue to Exchange
    // ========================================================================
    await channel.bindQueue(
      queueConfig.name,
      exchangeConfig.name,
      routingKey
    );
    console.log(
      `[Publisher] ✓ Queue bound to exchange with routing key: ${routingKey}`
    );

    // ========================================================================
    // STEP 6: Serialize Message
    // ========================================================================
    let messageBuffer;
    try {
      const messageString = JSON.stringify(message);
      messageBuffer = Buffer.from(messageString);
    } catch (error) {
      throw new Error(`Failed to serialize message: ${error.message}`);
    }

    // ========================================================================
    // STEP 7: Publish Message
    // ========================================================================
    const published = channel.publish(
      exchangeConfig.name,
      routingKey,
      messageBuffer,
      MESSAGE_OPTIONS
    );

    if (published) {
      console.log(
        `[Publisher] ✓ Message published to exchange: ${exchangeConfig.name}, routing key: ${routingKey}`
      );
      console.log('[Publisher] Message payload:', message);
      return true;
    } else {
      console.warn('[Publisher] ⚠ Message could not be published (buffer full)');
      return false;
    }
  } catch (error) {
    console.error('[Publisher] ✗ Failed to publish message:', error.message);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find the DLQ configuration for a given queue
 * 
 * @param {string} queueName - Name of the main queue
 * @returns {Object|null} - DLQ configuration or null if not found
 */
function findDLQForQueue(queueName) {
  // Map queue names to their DLQs
  const queueToDLQMap = {
    [QUEUES.EMAIL_QUEUE.name]: QUEUES.EMAIL_DLQ,
    // Add more mappings as needed
  };

  return queueToDLQMap[queueName] || null;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  publishMessage,
};
