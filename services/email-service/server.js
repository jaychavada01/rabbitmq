/**
 * Email Service - Server Entry Point
 * 
 * This is the main entry point for the Email Service.
 * 
 * Responsibilities:
 * - Initialize RabbitMQ connection
 * - Start RabbitMQ consumer
 * - Start Express server (for health checks)
 * - Handle graceful shutdown
 * 
 * Usage:
 *   node server.js
 */

const app = require('./src/app');
const config = require('./src/config/config');
const { connect, closeConnection } = require('./src/rabbitmq/connection');
const { startEmailConsumer } = require('./src/consumers/emailConsumer');

// ============================================================================
// SERVER STARTUP
// ============================================================================

/**
 * Start the Email Service
 * 
 * This function:
 * 1. Connects to RabbitMQ
 * 2. Starts the email consumer
 * 3. Starts the Express server (for health checks)
 * 4. Sets up graceful shutdown handlers
 */
async function startServer() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Starting Email Service...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ========================================================================
    // STEP 1: Connect to RabbitMQ
    // ========================================================================
    console.log('\n[1/3] Connecting to RabbitMQ...');
    await connect(config.rabbitmq.url);
    console.log('✓ RabbitMQ connection established\n');

    // ========================================================================
    // STEP 2: Start Email Consumer
    // ========================================================================
    console.log('[2/3] Starting email consumer...');
    await startEmailConsumer();
    console.log('✓ Email consumer started\n');

    // ========================================================================
    // STEP 3: Start Express Server (for health checks)
    // ========================================================================
    console.log('[3/3] Starting Express server...');
    const server = app.listen(config.server.port, () => {
      console.log('✓ Express server started\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`✅ ${config.server.name} is running!`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 Port: ${config.server.port}`);
      console.log(`🔗 URL: http://localhost:${config.server.port}`);
      console.log(`📡 RabbitMQ: ${config.rabbitmq.url}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n📝 Available Endpoints:');
      console.log(`   GET  http://localhost:${config.server.port}/`);
      console.log(`   GET  http://localhost:${config.server.port}/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('💡 Ready to process email messages!\n');
    });

    // ========================================================================
    // STEP 4: Setup Graceful Shutdown
    // ========================================================================
    setupGracefulShutdown(server);
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Failed to start Email Service');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

/**
 * Setup graceful shutdown handlers
 * 
 * Ensures that:
 * - All pending messages are processed
 * - RabbitMQ connection is closed properly
 * - Server stops accepting new connections
 * 
 * @param {Object} server - Express server instance
 */
function setupGracefulShutdown(server) {
  /**
   * Shutdown handler
   */
  const shutdown = async (signal) => {
    console.log(`\n\n🛑 ${signal} received. Starting graceful shutdown...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Stop accepting new connections
    server.close(async () => {
      console.log('✓ Express server closed (no longer accepting connections)');

      // Close RabbitMQ connection
      // This will also stop the consumer and wait for pending messages
      await closeConnection();

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ Graceful shutdown complete');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forceful shutdown (timeout reached)');
      process.exit(1);
    }, 10000);
  };

  // Listen for termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Uncaught Exception');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Unhandled Promise Rejection');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Promise:', promise);
    console.error('Reason:', reason);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    shutdown('UNHANDLED_REJECTION');
  });
}

// ============================================================================
// START SERVER
// ============================================================================

startServer();
