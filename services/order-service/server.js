/**
 * Order Service - Server Entry Point
 * 
 * This is the main entry point for the Order Service.
 * 
 * Responsibilities:
 * - Initialize RabbitMQ connection
 * - Start Express server
 * - Handle graceful shutdown
 * 
 * Usage:
 *   node server.js
 */

const app = require('./src/app');
const config = require('./src/config/config');
const { connect, closeConnection } = require('./src/rabbitmq/connection');

// ============================================================================
// SERVER STARTUP
// ============================================================================

/**
 * Start the Order Service
 * 
 * This function:
 * 1. Connects to RabbitMQ
 * 2. Starts the Express server
 * 3. Sets up graceful shutdown handlers
 */
async function startServer() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Starting Order Service...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // ========================================================================
    // STEP 1: Connect to RabbitMQ
    // ========================================================================
    console.log('\n[1/2] Connecting to RabbitMQ...');
    await connect(config.rabbitmq.url);
    console.log('✓ RabbitMQ connection established\n');

    // ========================================================================
    // STEP 2: Start Express Server
    // ========================================================================
    console.log('[2/2] Starting Express server...');
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
      console.log(`   POST http://localhost:${config.server.port}/api/orders`);
      console.log(`   GET  http://localhost:${config.server.port}/api/orders/health`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('💡 Ready to accept orders!\n');
    });

    // ========================================================================
    // STEP 3: Setup Graceful Shutdown
    // ========================================================================
    setupGracefulShutdown(server);
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ Failed to start Order Service');
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
 * - All pending requests are completed
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
