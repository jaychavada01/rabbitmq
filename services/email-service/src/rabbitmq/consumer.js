/**
 * RabbitMQ Consumer Utility
 * 
 * This module provides a reusable function for consuming messages from RabbitMQ.
 * 
 * Features:
 * - Automatic exchange and queue assertion
 * - Manual acknowledgement (ack/nack)
 * - Prefetch configuration for fair dispatch
 * - JSON deserialization with error handling
 * - Automatic DLQ routing on processing failure
 * - Callback-based message processing
 * 
 * Usage:
 *   const { consumeMessages } = require('./consumer');
 *   await consumeMessages(exchange, queue, routingKey, async (message) => {
 *     // Process message
 *     console.log(message);
 *   });
 */

const { getChannel } = require('./connection');
const {
  EXCHANGES,
  QUEUES,
  CONSUMER_OPTIONS,
} = require('./constants');

// ============================================================================
// CONSUMER FUNCTIONS
// ============================================================================

/**
 * Consume messages from RabbitMQ queue
 * 
 * This function:
 * 1. Asserts the exchange exists
 * 2. Asserts the queue exists (with DLQ configuration)
 * 3. Asserts the DLX and DLQ
 * 4. Binds the queue to the exchange
 * 5. Sets prefetch count for fair dispatch
 * 6. Starts consuming messages
 * 7. Deserializes messages from JSON
 * 8. Calls the provided callback for processing
 * 9. Acknowledges or rejects messages based on processing result
 * 
 * @param {Object} exchangeConfig - Exchange configuration from constants
 * @param {Object} queueConfig - Queue configuration from constants
 * @param {string} routingKey - Routing key for queue binding
 * @param {Function} onMessage - Async callback function to process messages
 *                                Should return true on success, false on failure
 * 
 * @example
 * await consumeMessages(
 *   EXCHANGES.ORDER_EXCHANGE,
 *   QUEUES.EMAIL_QUEUE,
 *   ROUTING_KEYS.ORDER_CREATED,
 *   async (message) => {
 *     console.log('Processing order:', message.orderId);
 *     // Process the message
 *     return true; // Return true on success, false on failure
 *   }
 * );
 */
async function consumeMessages(exchangeConfig, queueConfig, routingKey, onMessage) {
  try {
    // Get channel instance
    const channel = await getChannel();

    // ========================================================================
    // STEP 1: Assert Dead Letter Exchange (DLX)
    // ========================================================================
    await channel.assertExchange(
      EXCHANGES.DEAD_LETTER_EXCHANGE.name,
      EXCHANGES.DEAD_LETTER_EXCHANGE.type,
      EXCHANGES.DEAD_LETTER_EXCHANGE.options
    );
    console.log(`[Consumer] ✓ DLX asserted: ${EXCHANGES.DEAD_LETTER_EXCHANGE.name}`);

    // ========================================================================
    // STEP 2: Assert Dead Letter Queue (DLQ)
    // ========================================================================
    const dlqConfig = findDLQForQueue(queueConfig.name);
    if (dlqConfig) {
      await channel.assertQueue(dlqConfig.name, dlqConfig.options);
      console.log(`[Consumer] ✓ DLQ asserted: ${dlqConfig.name}`);

      // Bind DLQ to DLX
      const dlqRoutingKey = queueConfig.options.arguments['x-dead-letter-routing-key'];
      await channel.bindQueue(
        dlqConfig.name,
        EXCHANGES.DEAD_LETTER_EXCHANGE.name,
        dlqRoutingKey
      );
      console.log(
        `[Consumer] ✓ DLQ bound to DLX with routing key: ${dlqRoutingKey}`
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
    console.log(`[Consumer] ✓ Exchange asserted: ${exchangeConfig.name}`);

    // ========================================================================
    // STEP 4: Assert Main Queue
    // ========================================================================
    await channel.assertQueue(queueConfig.name, queueConfig.options);
    console.log(`[Consumer] ✓ Queue asserted: ${queueConfig.name}`);

    // ========================================================================
    // STEP 5: Bind Queue to Exchange
    // ========================================================================
    await channel.bindQueue(
      queueConfig.name,
      exchangeConfig.name,
      routingKey
    );
    console.log(
      `[Consumer] ✓ Queue bound to exchange with routing key: ${routingKey}`
    );

    // ========================================================================
    // STEP 6: Set Prefetch Count
    // ========================================================================
    // This ensures fair dispatch - each consumer gets only N unacknowledged messages
    // Setting to 1 means each consumer processes one message at a time
    await channel.prefetch(CONSUMER_OPTIONS.prefetchCount);
    console.log(
      `[Consumer] ✓ Prefetch count set to: ${CONSUMER_OPTIONS.prefetchCount}`
    );

    // ========================================================================
    // STEP 7: Start Consuming Messages
    // ========================================================================
    await channel.consume(
      queueConfig.name,
      async (msg) => {
        if (!msg) {
          console.warn('[Consumer] ⚠ Received null message (consumer cancelled)');
          return;
        }

        try {
          // Deserialize message
          const messageContent = deserializeMessage(msg);
          
          console.log('[Consumer] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('[Consumer] 📨 Message received from queue:', queueConfig.name);
          console.log('[Consumer] Message content:', messageContent);
          console.log('[Consumer] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

          // Process message using provided callback
          const success = await onMessage(messageContent);

          if (success) {
            // ============================================================
            // SUCCESS: Acknowledge the message
            // ============================================================
            // This removes the message from the queue
            channel.ack(msg);
            console.log('[Consumer] ✓ Message acknowledged (processed successfully)');
          } else {
            // ============================================================
            // FAILURE: Reject the message and send to DLQ
            // ============================================================
            // requeue: false means the message will be sent to DLX/DLQ
            channel.nack(msg, false, false);
            console.log('[Consumer] ✗ Message rejected (sent to DLQ)');
          }
        } catch (error) {
          // ================================================================
          // ERROR: Reject the message and send to DLQ
          // ================================================================
          console.error('[Consumer] ✗ Error processing message:', error.message);
          console.error('[Consumer] Stack trace:', error.stack);
          
          // Reject message without requeue (sends to DLQ)
          channel.nack(msg, false, false);
          console.log('[Consumer] ✗ Message rejected due to error (sent to DLQ)');
        }
      },
      {
        noAck: CONSUMER_OPTIONS.noAck, // Manual acknowledgement
      }
    );

    console.log('[Consumer] ✓ Consumer started successfully');
    console.log(`[Consumer] 👂 Waiting for messages on queue: ${queueConfig.name}...`);
  } catch (error) {
    console.error('[Consumer] ✗ Failed to start consumer:', error.message);
    throw error;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Deserialize message from Buffer to JavaScript object
 * 
 * @param {Object} msg - RabbitMQ message object
 * @returns {Object} - Deserialized message content
 * @throws {Error} - If deserialization fails
 */
function deserializeMessage(msg) {
  try {
    const messageString = msg.content.toString();
    const messageObject = JSON.parse(messageString);
    return messageObject;
  } catch (error) {
    throw new Error(`Failed to deserialize message: ${error.message}`);
  }
}

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
  consumeMessages,
};
