/**
 * RabbitMQ Constants
 * 
 * This file contains all RabbitMQ-related constants including:
 * - Exchange names and types
 * - Queue names
 * - Routing keys
 * - Dead Letter Queue (DLQ) configuration
 * 
 * Purpose: Centralize all RabbitMQ identifiers to avoid magic strings
 * and make the codebase more maintainable.
 */

/**
 * Main exchange for order-related events
 * Type: direct - routes messages based on exact routing key match
 */
const EXCHANGES = {
  ORDER_EXCHANGE: {
    name: 'order.exchange',
    type: 'direct',
    options: {
      durable: true, // Survives broker restarts
      autoDelete: false, // Won't be deleted when no queues are bound
    },
  },
  
  /**
   * Dead Letter Exchange (DLX)
   * Receives messages that failed processing or were rejected
   */
  DEAD_LETTER_EXCHANGE: {
    name: 'dlx.exchange',
    type: 'direct',
    options: {
      durable: true,
      autoDelete: false,
    },
  },
};

/**
 * Queue configurations with DLQ support
 */
const QUEUES = {
  /**
   * Email queue - receives order confirmation messages
   */
  EMAIL_QUEUE: {
    name: 'email.queue',
    options: {
      durable: true, // Survives broker restarts
      autoDelete: false,
      // Dead letter configuration - failed messages go to DLQ
      arguments: {
        'x-dead-letter-exchange': 'dlx.exchange',
        'x-dead-letter-routing-key': 'email.dlq',
      },
    },
  },
  
  /**
   * Dead Letter Queue for email messages
   * Stores messages that failed processing for manual inspection
   */
  EMAIL_DLQ: {
    name: 'email.dlq',
    options: {
      durable: true,
      autoDelete: false,
    },
  },
};

/**
 * Routing keys for message routing
 * Format: <entity>.<action>
 */
const ROUTING_KEYS = {
  ORDER_CREATED: 'order.created',
  EMAIL_DLQ: 'email.dlq',
};

/**
 * Default options for published messages
 */
const MESSAGE_OPTIONS = {
  persistent: true, // Messages survive broker restarts (stored on disk)
  contentType: 'application/json',
  contentEncoding: 'utf-8',
};

/**
 * Consumer configuration
 */
const CONSUMER_OPTIONS = {
  /**
   * Prefetch count - number of unacknowledged messages a consumer can have
   * This ensures fair dispatch across multiple consumers
   * Set to 1 for maximum fairness (each consumer processes one message at a time)
   */
  prefetchCount: 1,
  
  /**
   * No automatic acknowledgement - we'll manually ack/nack messages
   * This gives us control over when a message is considered processed
   */
  noAck: false,
};

module.exports = {
  EXCHANGES,
  QUEUES,
  ROUTING_KEYS,
  MESSAGE_OPTIONS,
  CONSUMER_OPTIONS,
};
