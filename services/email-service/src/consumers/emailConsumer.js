/**
 * Email Consumer
 * 
 * This module sets up the RabbitMQ consumer for processing email messages.
 * 
 * Responsibilities:
 * - Initialize RabbitMQ consumer
 * - Process incoming order.created events
 * - Call email service to send emails
 * - Handle acknowledgements (ack/nack)
 */

const { consumeMessages } = require('../rabbitmq/consumer');
const {
  EXCHANGES,
  QUEUES,
  ROUTING_KEYS,
} = require('../rabbitmq/constants');
const { sendOrderConfirmationEmail } = require('../services/emailService');

/**
 * Start the email consumer
 * 
 * This function:
 * 1. Sets up the RabbitMQ consumer
 * 2. Listens for order.created events
 * 3. Processes each message by sending an email
 * 4. Returns success/failure status for ack/nack
 */
async function startEmailConsumer() {
  try {
    console.log('[Email Consumer] Starting email consumer...');

    // Start consuming messages from the email queue
    await consumeMessages(
      EXCHANGES.ORDER_EXCHANGE,
      QUEUES.EMAIL_QUEUE,
      ROUTING_KEYS.ORDER_CREATED,
      processOrderMessage // Callback function to process each message
    );

    console.log('[Email Consumer] ✓ Email consumer started successfully');
    console.log('[Email Consumer] 👂 Waiting for order.created events...');
    console.log('[Email Consumer] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('[Email Consumer] ✗ Failed to start consumer:', error.message);
    throw error;
  }
}

/**
 * Process an order message
 * 
 * This function is called for each message received from RabbitMQ.
 * 
 * @param {Object} message - Deserialized message from RabbitMQ
 * @returns {Promise<boolean>} - True if processed successfully, false otherwise
 * 
 * The return value determines message acknowledgement:
 * - true: Message is ack'd (removed from queue)
 * - false: Message is nack'd (sent to DLQ)
 */
async function processOrderMessage(message) {
  try {
    console.log('[Email Consumer] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[Email Consumer] 📬 Processing order message...');
    console.log('[Email Consumer] Event Type:', message.eventType);
    console.log('[Email Consumer] Order ID:', message.orderId);
    console.log('[Email Consumer] Customer Email:', message.customerEmail);
    console.log('[Email Consumer] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // STEP 1: Validate Message
    if (message.eventType !== 'order.created') {
      console.warn('[Email Consumer] ⚠ Unexpected event type:', message.eventType);
      // Return false to send to DLQ for manual inspection
      return false;
    }

    // STEP 2: Send Email
    const emailSent = await sendOrderConfirmationEmail(message);

    if (emailSent) {
      console.log('[Email Consumer] ✓ Order message processed successfully');
      return true; // Acknowledge the message
    } else {
      console.error('[Email Consumer] ✗ Failed to send email');
      return false; // Reject the message (will go to DLQ)
    }
  } catch (error) {
    console.error('[Email Consumer] ✗ Error processing message:', error.message);
    console.error('[Email Consumer] Stack trace:', error.stack);
    
    // Return false to reject the message and send to DLQ
    return false;
  }
}

module.exports = {
  startEmailConsumer,
};
