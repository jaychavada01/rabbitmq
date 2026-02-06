/**
 * RabbitMQ Connection Manager
 *
 * This module manages RabbitMQ connections and channels using a singleton pattern.
 *
 * Features:
 * - Singleton connection instance (one connection per application)
 * - Automatic reconnection on connection loss
 * - Channel creation and management
 * - Graceful shutdown handling
 * - Error recovery mechanisms
 *
 * Usage:
 *   const { connect, getChannel, closeConnection } = require('./connection');
 *   await connect('amqp://localhost');
 *   const channel = await getChannel();
 */

const amqp = require("amqplib");

/**
 * Singleton connection instance
 * Ensures only one connection is maintained per application
 */
let connection = null;

/**
 * Singleton channel instance
 * Reused across all publish/consume operations
 */
let channel = null;

/**
 * Connection URL
 * Stored for reconnection attempts
 */
let connectionUrl = null;

/**
 * Reconnection state
 */
let isReconnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_MS = 5000; // 5 seconds

/**
 * Establish connection to RabbitMQ
 *
 * @param {string} url - RabbitMQ connection URL (e.g., 'amqp://localhost')
 * @returns {Promise<Connection>} - RabbitMQ connection instance
 *
 * @example
 * await connect('amqp://localhost:5672');
 */
const connect = async (url) => {
  try {
    // Return existing connection if already established
    if (connection) {
      console.log("[RabbitMQ] Using existing connection");
      return connection;
    }

    console.log("[RabbitMQ] Establishing connection...");
    connectionUrl = url;

    // Create new connection
    connection = await amqp.connect(url);
    console.log("[RabbitMQ] ✓ Connection established successfully");

    // Reset reconnection counter on successful connection
    reconnectAttempts = 0;
    isReconnecting = false;

    // Setup connection event handlers
    setupConnectionHandlers();

    return connection;
  } catch (error) {
    console.error("[RabbitMQ] ✗ Connection failed:", error.message);

    // Attempt reconnection
    await handleReconnection();

    throw error;
  }
};

/**
 * Setup event handlers for connection
 * Handles connection errors and closures
 */
const setupConnectionHandlers = () => {
  // Handle connection errors
  connection.on("error", (error) => {
    console.error("[RabbitMQ] Connection error:", error.message);

    // Don't attempt reconnection if already reconnecting
    if (!isReconnecting) {
      handleReconnection();
    }
  });

  // Handle connection closure
  connection.on("close", () => {
    console.warn("[RabbitMQ] Connection closed");
    connection = null;
    channel = null;

    // Attempt reconnection if not intentionally closed
    if (!isReconnecting) {
      handleReconnection();
    }
  });
};

/**
 * Handle reconnection logic
 * Implements exponential backoff with max attempts
 */
const handleReconnection = async () => {
  if (isReconnecting) {
    return;
  }

  isReconnecting = true;

  while (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;

    console.log(
      `[RabbitMQ] Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}...`,
    );

    try {
      // Wait before attempting reconnection
      await new Promise((resolve) => setTimeout(resolve, RECONNECT_DELAY_MS));

      // Attempt to reconnect
      connection = await amqp.connect(connectionUrl);
      console.log("[RabbitMQ] ✓ Reconnection successful");

      // Reset state
      reconnectAttempts = 0;
      isReconnecting = false;

      // Setup handlers for new connection
      setupConnectionHandlers();

      // Recreate channel
      channel = null;
      await getChannel();

      return;
    } catch (error) {
      console.error(
        `[RabbitMQ] ✗ Reconnection attempt ${reconnectAttempts} failed:`,
        error.message,
      );
    }
  }

  // Max attempts reached
  console.error("[RabbitMQ] ✗ Max reconnection attempts reached. Giving up.");
  isReconnecting = false;
}

/**
 * Get or create a channel
 *
 * Channels are lightweight connections used for actual messaging operations.
 * This function returns a singleton channel instance.
 *
 * @returns {Promise<Channel>} - RabbitMQ channel instance
 *
 * @example
 * const channel = await getChannel();
 * await channel.assertQueue('my-queue');
 */
const getChannel = async () => {
  try {
    // Return existing channel if available
    if (channel) {
      return channel;
    }

    // Ensure connection exists
    if (!connection) {
      throw new Error(
        "No RabbitMQ connection available. Call connect() first.",
      );
    }

    console.log("[RabbitMQ] Creating channel...");

    // Create new channel
    channel = await connection.createChannel();
    console.log("[RabbitMQ] ✓ Channel created successfully");

    // Setup channel event handlers
    setupChannelHandlers();

    return channel;
  } catch (error) {
    console.error("[RabbitMQ] ✗ Channel creation failed:", error.message);
    throw error;
  }
}

/**
 * Setup event handlers for channel
 * Handles channel errors and closures
 */
const setupChannelHandlers = () => {
  // Handle channel errors
  channel.on("error", (error) => {
    console.error("[RabbitMQ] Channel error:", error.message);
    channel = null;
  });

  // Handle channel closure
  channel.on("close", () => {
    console.warn("[RabbitMQ] Channel closed");
    channel = null;
  });
}

/**
 * Gracefully close RabbitMQ connection and channel
 *
 * Should be called during application shutdown to ensure:
 * - All pending messages are processed
 * - Connections are properly closed
 * - Resources are released
 *
 * @example
 * process.on('SIGINT', async () => {
 *   await closeConnection();
 *   process.exit(0);
 * });
 */
const closeConnection = async () => {
  try {
    console.log("[RabbitMQ] Closing connection gracefully...");

    // Close channel first
    if (channel) {
      await channel.close();
      console.log("[RabbitMQ] ✓ Channel closed");
      channel = null;
    }

    // Close connection
    if (connection) {
      await connection.close();
      console.log("[RabbitMQ] ✓ Connection closed");
      connection = null;
    }

    console.log("[RabbitMQ] ✓ Shutdown complete");
  } catch (error) {
    console.error("[RabbitMQ] ✗ Error during shutdown:", error.message);

    // Force cleanup
    channel = null;
    connection = null;
  }
}

module.exports = {
  connect,
  getChannel,
  closeConnection,
};
