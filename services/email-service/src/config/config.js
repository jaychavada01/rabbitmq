/**
 * Email Service Configuration
 * 
 * This file centralizes all configuration for the Email Service.
 * Environment variables are loaded from .env file or system environment.
 * 
 * Configuration includes:
 * - Server port
 * - RabbitMQ connection URL
 * - Service name and version
 */

require('dotenv').config();

module.exports = {
  /**
   * Server Configuration
   */
  server: {
    port: process.env.PORT || 3002,
    name: 'Email Service',
    version: '1.0.0',
  },

  /**
   * RabbitMQ Configuration
   */
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  },
};
