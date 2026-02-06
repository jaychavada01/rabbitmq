/**
 * Email Service
 * 
 * This module contains the business logic for processing email messages.
 * 
 * Responsibilities:
 * - Validate email data
 * - Send email notifications (simulated)
 * - Handle errors gracefully
 * - Return processing status
 */

// ============================================================================
// EMAIL SERVICE FUNCTIONS
// ============================================================================

/**
 * Send order confirmation email
 * 
 * In a production environment, this would integrate with an email service
 * provider like SendGrid, AWS SES, or Mailgun.
 * 
 * For this demo, we simulate email sending with a delay.
 * 
 * @param {Object} orderData - Order information from RabbitMQ message
 * @returns {Promise<boolean>} - True if email sent successfully, false otherwise
 * 
 * @example
 * const success = await sendOrderConfirmationEmail({
 *   orderId: 'ORD-001',
 *   customerEmail: 'customer@example.com',
 *   items: ['Product A'],
 *   total: 99.99
 * });
 */
async function sendOrderConfirmationEmail(orderData) {
  try {
    const { orderId, customerEmail, items, total, createdAt } = orderData;

    // ========================================================================
    // STEP 1: Validate Email Data
    // ========================================================================
    if (!orderId || !customerEmail || !items || !total) {
      throw new Error('Missing required email data');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      throw new Error('Invalid email address');
    }

    console.log('[Email Service] Preparing to send email...');
    console.log('[Email Service] To:', customerEmail);
    console.log('[Email Service] Subject: Order Confirmation - Order #' + orderId);

    // STEP 2: Prepare Email Content
    const emailContent = generateEmailContent(orderData);
    
    console.log('[Email Service] Email Content:');
    console.log(emailContent);

    // STEP 3: Send Email (Simulated)
    // In production, replace this with actual email service integration:
    // - SendGrid: await sgMail.send(emailData)
    // - AWS SES: await ses.sendEmail(params).promise()
    // - Mailgun: await mailgun.messages().send(data)
    
    console.log('[Email Service] 📤 Sending email...');
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Simulate occasional failures for testing (5% failure rate)
    // Comment this out for 100% success rate
    if (Math.random() < 0.05) {
      throw new Error('Simulated email service error (5% random failure)');
    }

    console.log('[Email Service] ✓ Email sent successfully!');
    return true;
  } catch (error) {
    console.error('[Email Service] ✗ Failed to send email:', error.message);
    // Return false to indicate failure (message will be nack'd and sent to DLQ)
    return false;
  }
}

/**
 * Generate email content from order data
 * 
 * @param {Object} orderData - Order information
 * @returns {string} - Formatted email content
 */
function generateEmailContent(orderData) {
  const { orderId, customerEmail, items, total, createdAt } = orderData;

  return `
╔════════════════════════════════════════════════════════════╗
║           ORDER CONFIRMATION EMAIL                         ║
╚════════════════════════════════════════════════════════════╝

Dear Customer,

Thank you for your order! We're excited to confirm that we've 
received your order and it's being processed.

Order Details:
──────────────────────────────────────────────────────────────
Order ID:       ${orderId}
Order Date:     ${new Date(createdAt).toLocaleString()}
Customer Email: ${customerEmail}

Items Ordered:
${items.map((item, index) => `  ${index + 1}. ${item}`).join('\n')}

Total Amount:   $${total.toFixed(2)}
──────────────────────────────────────────────────────────────

What's Next?
• Your order is being prepared for shipment
• You'll receive a shipping confirmation once it's on its way
• Track your order at: https://example.com/orders/${orderId}

Questions?
If you have any questions about your order, please contact us at
support@example.com or call 1-800-EXAMPLE.

Thank you for shopping with us!

Best regards,
The Example Store Team

╚════════════════════════════════════════════════════════════╝
  `;
}

module.exports = {
  sendOrderConfirmationEmail,
};
