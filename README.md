# RabbitMQ Microservices - Production-Ready Boilerplate

A complete, production-ready implementation of RabbitMQ-based microservices using Node.js, Express.js, and amqplib. This project demonstrates asynchronous communication between two independent microservices: **Order Service** (producer) and **Email Service** (consumer).

## 🎯 Features

- ✅ **Production-Ready**: Includes DLQ, manual acknowledgements, prefetch, and durable queues
- ✅ **Reusable RabbitMQ Module**: Centralized, framework-agnostic messaging logic
- ✅ **Clean Architecture**: Separation of concerns with proper folder structure
- ✅ **Error Handling**: Comprehensive error handling with automatic DLQ routing
- ✅ **Graceful Shutdown**: Proper cleanup of connections and resources
- ✅ **No Magic Strings**: All constants centralized and well-documented
- ✅ **Fully Independent Services**: Each microservice can run standalone

---

## 📁 Project Structure

```
rabbitmq-microservices/
├── services/
│   ├── order-service/               # Producer microservice
│   │   ├── src/
│   │   │   ├── rabbitmq/            # RabbitMQ module (self-contained)
│   │   │   │   ├── connection.js
│   │   │   │   ├── publisher.js
│   │   │   │   ├── consumer.js
│   │   │   │   └── constants.js
│   │   │   ├── controllers/
│   │   │   │   └── orderController.js
│   │   │   ├── routes/
│   │   │   │   └── orderRoutes.js
│   │   │   ├── config/
│   │   │   │   └── config.js
│   │   │   └── app.js
│   │   ├── server.js
│   │   └── package.json
│   │
│   └── email-service/               # Consumer microservice
│       ├── src/
│       │   ├── rabbitmq/            # RabbitMQ module (self-contained)
│       │   │   ├── connection.js
│       │   │   ├── publisher.js
│       │   │   ├── consumer.js
│       │   │   └── constants.js
│       │   ├── consumers/
│       │   │   └── emailConsumer.js
│       │   ├── services/
│       │   │   └── emailService.js
│       │   ├── config/
│       │   │   └── config.js
│       │   └── app.js
│       ├── server.js
│       └── package.json
│
└── README.md                        # This file
```

---

## 🏗️ Architecture Overview

### Message Flow

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Order Service  │────────▶│    RabbitMQ      │────────▶│  Email Service  │
│   (Producer)    │         │   Message Broker │         │   (Consumer)    │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
       │                             │                            │
       │                             │                            │
       ▼                             ▼                            ▼
  POST /api/orders          order.exchange              Send Email
  Publish Message           email.queue                 Ack/Nack
                            email.dlq (DLQ)
```

### Component Responsibilities

#### **Order Service (Producer)**
- Receives HTTP POST requests to create orders
- Validates order data
- Publishes `order.created` events to RabbitMQ
- Returns HTTP response to client

#### **Email Service (Consumer)**
- Listens for `order.created` events from RabbitMQ
- Processes each message by sending confirmation emails
- Acknowledges successful processing (ack)
- Rejects failed messages to DLQ (nack)

#### **Shared RabbitMQ Module** (Copied into each service)
- **connection.js**: Manages singleton connection with auto-reconnection
- **publisher.js**: Publishes messages with persistence and DLQ setup
- **consumer.js**: Consumes messages with manual ack/nack and prefetch
- **constants.js**: Centralizes all RabbitMQ identifiers

> **Note**: Each service has its own copy of the RabbitMQ module, making them completely independent and deployable.

---

## 🔧 RabbitMQ Concepts Used

### 1. **Direct Exchange**
- Routes messages based on exact routing key match
- Exchange: `order.exchange`
- Routing Key: `order.created`

### 2. **Durable Queues and Exchanges**
- Survive broker restarts
- Messages are persisted to disk
- Ensures no message loss during failures

### 3. **Manual Acknowledgements (ack/nack)**
- Consumer explicitly acknowledges message processing
- **ack**: Message processed successfully (removed from queue)
- **nack**: Message failed processing (sent to DLQ)
- Prevents message loss on consumer crashes

### 4. **Dead Letter Queue (DLQ)**
- Receives messages that failed processing
- Allows manual inspection and retry
- DLX: `dlx.exchange`
- DLQ: `email.dlq`

### 5. **Prefetch Count**
- Limits unacknowledged messages per consumer
- Set to 1 for fair dispatch (round-robin)
- Prevents overwhelming slow consumers

### 6. **Persistent Messages**
- Messages stored on disk
- Survive broker restarts
- `persistent: true` in message options

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v14 or higher
- **RabbitMQ**: Running instance (local or remote)
- **npm**: Package manager

### Installation

#### 1. **Start RabbitMQ**

Using Docker (recommended):
```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

Access RabbitMQ Management UI: http://localhost:15672
- Username: `guest`
- Password: `guest`

#### 2. **Install Dependencies**

**Order Service:**
```bash
cd services/order-service
npm install
```

**Email Service:**
```bash
cd services/email-service
npm install
```

#### 3. **Configure Environment (Optional)**

Create `.env` files in each service directory:

**services/order-service/.env:**
```env
PORT=3001
RABBITMQ_URL=amqp://localhost:5672
```

**services/email-service/.env:**
```env
PORT=3002
RABBITMQ_URL=amqp://localhost:5672
```

---

## ▶️ Running the Services

### Start Email Service (Consumer) First

```bash
cd services/email-service
npm start
```

**Expected Output:**
```
🚀 Starting Email Service...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/3] Connecting to RabbitMQ...
[RabbitMQ] ✓ Connection established successfully
✓ RabbitMQ connection established

[2/3] Starting email consumer...
[Email Consumer] ✓ Email consumer started successfully
[Email Consumer] 👂 Waiting for order.created events...
✓ Email consumer started

[3/3] Starting Express server...
✓ Express server started

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Email Service is running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Port: 3002
🔗 URL: http://localhost:3002
📡 RabbitMQ: amqp://localhost:5672
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Ready to process email messages!
```

### Start Order Service (Producer)

Open a new terminal:
```bash
cd services/order-service
npm start
```

**Expected Output:**
```
🚀 Starting Order Service...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/2] Connecting to RabbitMQ...
[RabbitMQ] ✓ Connection established successfully
✓ RabbitMQ connection established

[2/2] Starting Express server...
✓ Express server started

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Order Service is running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Port: 3001
🔗 URL: http://localhost:3001
📡 RabbitMQ: amqp://localhost:5672
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Available Endpoints:
   GET  http://localhost:3001/
   POST http://localhost:3001/api/orders
   GET  http://localhost:3001/api/orders/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Ready to accept orders!
```

---

## 🧪 Testing the Flow

### 1. **Create an Order (Success Case)**

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-001",
    "customerEmail": "customer@example.com",
    "items": ["Product A", "Product B"],
    "total": 99.99
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "ORD-001",
    "status": "pending",
    "message": "Order confirmation email will be sent shortly"
  }
}
```

**Order Service Console:**
```
[Order Controller] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Order Controller] 📦 New order received
[Order Controller] Order ID: ORD-001
[Order Controller] Customer Email: customer@example.com
[Order Controller] Items: [ 'Product A', 'Product B' ]
[Order Controller] Total: 99.99
[Order Controller] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Publisher] ✓ Message published to exchange: order.exchange
[Order Controller] ✓ Order event published to RabbitMQ
```

**Email Service Console:**
```
[Consumer] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Consumer] 📨 Message received from queue: email.queue
[Consumer] Message content: {
  orderId: 'ORD-001',
  customerEmail: 'customer@example.com',
  items: [ 'Product A', 'Product B' ],
  total: 99.99,
  createdAt: '2026-02-05T11:22:53.000Z',
  eventType: 'order.created'
}
[Consumer] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Email Service] 📧 Preparing to send email...
[Email Service] To: customer@example.com
[Email Service] Subject: Order Confirmation - Order #ORD-001
[Email Service] ✓ Email sent successfully!
[Consumer] ✓ Message acknowledged (processed successfully)
```

### 2. **Test Validation (Error Case)**

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-002",
    "customerEmail": "invalid-email",
    "items": [],
    "total": 0
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Items must be a non-empty array"
}
```

### 3. **Monitor RabbitMQ Management UI**

1. Open http://localhost:15672
2. Login with `guest` / `guest`
3. Navigate to **Queues** tab
4. Verify:
   - `email.queue` exists and is processing messages
   - `email.dlq` exists for failed messages
5. Navigate to **Exchanges** tab
6. Verify:
   - `order.exchange` (direct)
   - `dlx.exchange` (direct)

### 4. **Test DLQ (Simulated Failure)**

The Email Service has a built-in 5% random failure rate for testing. Send multiple orders to trigger failures:

```bash
for i in {1..20}; do
  curl -X POST http://localhost:3001/api/orders \
    -H "Content-Type: application/json" \
    -d "{
      \"orderId\": \"ORD-$i\",
      \"customerEmail\": \"customer$i@example.com\",
      \"items\": [\"Product A\"],
      \"total\": 50.00
    }"
  sleep 0.5
done
```

Check the `email.dlq` queue in RabbitMQ Management UI for failed messages.

---

## 🎨 Design Decisions

### 1. **Singleton Connection Pattern**
- **Why**: RabbitMQ connections are expensive (TCP handshake, authentication)
- **Benefit**: One connection per application reduces overhead
- **Implementation**: `connection.js` maintains a single connection instance

### 2. **Automatic Reconnection**
- **Why**: Network failures and broker restarts are common
- **Benefit**: Services automatically recover without manual intervention
- **Implementation**: Exponential backoff with max retry attempts

### 3. **Manual Acknowledgements**
- **Why**: Automatic ack can lose messages if consumer crashes
- **Benefit**: Messages only removed after successful processing
- **Implementation**: Consumer explicitly calls `ack()` or `nack()`

### 4. **Dead Letter Queue (DLQ)**
- **Why**: Failed messages need manual inspection and retry
- **Benefit**: Prevents message loss and allows debugging
- **Implementation**: Automatic routing via `x-dead-letter-exchange`

### 5. **Prefetch Count = 1**
- **Why**: Ensures fair distribution across multiple consumers
- **Benefit**: No single consumer gets overwhelmed
- **Trade-off**: Lower throughput, but better load balancing

### 6. **Persistent Messages**
- **Why**: Messages must survive broker restarts
- **Benefit**: No data loss during failures
- **Implementation**: `persistent: true` in message options

### 7. **Centralized Constants**
- **Why**: Avoid magic strings and typos
- **Benefit**: Single source of truth, easier maintenance
- **Implementation**: `constants.js` exports all identifiers

### 8. **Separation of Concerns**
- **Why**: Clean architecture principles
- **Benefit**: Reusable, testable, maintainable code
- **Implementation**: Separate modules for connection, publisher, consumer

---

## 🔄 Extending the Boilerplate

### Adding a New Queue

1. **Update `shared/rabbitmq/constants.js`:**
```javascript
const QUEUES = {
  // ... existing queues
  NOTIFICATION_QUEUE: {
    name: 'notification.queue',
    options: {
      durable: true,
      autoDelete: false,
      arguments: {
        'x-dead-letter-exchange': 'dlx.exchange',
        'x-dead-letter-routing-key': 'notification.dlq',
      },
    },
  },
  NOTIFICATION_DLQ: {
    name: 'notification.dlq',
    options: {
      durable: true,
      autoDelete: false,
    },
  },
};

const ROUTING_KEYS = {
  // ... existing keys
  ORDER_SHIPPED: 'order.shipped',
};
```

2. **Update DLQ mapping in `publisher.js` and `consumer.js`:**
```javascript
const queueToDLQMap = {
  [QUEUES.EMAIL_QUEUE.name]: QUEUES.EMAIL_DLQ,
  [QUEUES.NOTIFICATION_QUEUE.name]: QUEUES.NOTIFICATION_DLQ,
};
```

3. **Create a new consumer service** following the Email Service pattern.

### Adding a New Producer

1. Create a new service directory under `services/`
2. Copy the Order Service structure
3. Update the controller to publish to your desired exchange/queue
4. Use the shared RabbitMQ module for publishing

---

## 🛠️ Troubleshooting

### Issue: Connection Refused

**Symptom:**
```
[RabbitMQ] ✗ Connection failed: connect ECONNREFUSED 127.0.0.1:5672
```

**Solution:**
- Ensure RabbitMQ is running: `docker ps | grep rabbitmq`
- Check RabbitMQ logs: `docker logs rabbitmq`
- Verify connection URL in config

### Issue: Messages Not Being Consumed

**Symptom:** Messages appear in queue but aren't processed

**Solution:**
- Ensure Email Service is running
- Check consumer logs for errors
- Verify queue binding in RabbitMQ Management UI
- Check prefetch settings

### Issue: Messages Going to DLQ

**Symptom:** All messages end up in `email.dlq`

**Solution:**
- Check Email Service logs for processing errors
- Verify message format matches expected schema
- Disable the 5% random failure in `emailService.js`

---

## 📖 RabbitMQ Complete Guide

### Understanding RabbitMQ with Node.js

This section explains how RabbitMQ works and how to implement different messaging patterns in Node.js.

---

### 🎯 Core Concepts

#### **1. Producer (Publisher)**
Application that **sends messages** to RabbitMQ.

```javascript
// Producer example
const message = { orderId: '123', total: 99.99 };
await channel.publish('order.exchange', 'order.created', Buffer.from(JSON.stringify(message)));
```

#### **2. Exchange**
Receives messages from producers and **routes them to queues** based on rules.

**Types:** Direct, Fanout, Topic, Headers

#### **3. Queue**
**Stores messages** until consumers are ready to process them.

```javascript
await channel.assertQueue('email.queue', { durable: true });
```

#### **4. Binding**
**Links an exchange to a queue** with a routing key.

```javascript
await channel.bindQueue('email.queue', 'order.exchange', 'order.created');
```

#### **5. Consumer (Subscriber)**
Application that **receives and processes messages** from queues.

```javascript
await channel.consume('email.queue', (msg) => {
  const data = JSON.parse(msg.content.toString());
  channel.ack(msg);
});
```

---

### 🔀 Exchange Types

#### **1. Direct Exchange** (Current Implementation)

Routes messages to queues based on **exact routing key match**.

**Use Case:** Send specific messages to specific queues.

```
Producer ──[routing_key: "order.created"]──▶ Direct Exchange
                                                    │
                        ┌───────────────────────────┼───────────────┐
                        ▼                           ▼               ▼
                [order.created]              [order.updated]  [order.deleted]
                        │                           │               │
                        ▼                           ▼               ▼
                  email.queue                  sms.queue      analytics.queue
```

**Node.js Implementation:**

```javascript
// 1. Create exchange
await channel.assertExchange('order.exchange', 'direct', { durable: true });

// 2. Create queues
await channel.assertQueue('email.queue', { durable: true });
await channel.assertQueue('sms.queue', { durable: true });

// 3. Bind queues with routing keys
await channel.bindQueue('email.queue', 'order.exchange', 'order.created');
await channel.bindQueue('sms.queue', 'order.exchange', 'order.created');

// 4. Publish message
channel.publish(
  'order.exchange',
  'order.created', // Routing key
  Buffer.from(JSON.stringify({ orderId: '123' })),
  { persistent: true }
);

// Result: Both email.queue and sms.queue receive the message
```

**When to Use:**
- ✅ Specific routing based on message type
- ✅ Multiple consumers for the same event
- ✅ Need control over which queues receive messages

---

#### **2. Fanout Exchange**

Routes messages to **ALL bound queues**, ignoring routing keys.

**Use Case:** Broadcast messages to multiple consumers.

```
Producer ──[routing_key: ignored]──▶ Fanout Exchange
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    ▼                       ▼                       ▼
              email.queue              sms.queue              push.queue
```

**Node.js Implementation:**

```javascript
// 1. Create fanout exchange
await channel.assertExchange('notifications', 'fanout', { durable: true });

// 2. Create queues
await channel.assertQueue('email.queue', { durable: true });
await channel.assertQueue('sms.queue', { durable: true });
await channel.assertQueue('push.queue', { durable: true });

// 3. Bind queues (no routing key needed)
await channel.bindQueue('email.queue', 'notifications', '');
await channel.bindQueue('sms.queue', 'notifications', '');
await channel.bindQueue('push.queue', 'notifications', '');

// 4. Publish message (routing key is ignored)
channel.publish(
  'notifications',
  '', // Routing key ignored
  Buffer.from(JSON.stringify({ orderId: '123' })),
  { persistent: true }
);

// Result: ALL three queues receive the message
```

**When to Use:**
- ✅ Broadcast to all consumers
- ✅ Event-driven architecture
- ✅ Add new consumers without changing producer

---

#### **3. Topic Exchange**

Routes messages based on **pattern matching** with routing keys.

**Use Case:** Complex routing with wildcards.

**Wildcards:**
- `*` (star) - matches exactly one word
- `#` (hash) - matches zero or more words

```
Producer ──[routing_key: "order.created.email"]──▶ Topic Exchange
                                                          │
                    ┌─────────────────────────────────────┼─────────────────┐
                    ▼                                     ▼                 ▼
            [order.*.email]                      [order.created.*]    [order.#]
                    │                                     │                 │
                    ▼                                     ▼                 ▼
              email.queue                            sms.queue        analytics.queue
```

**Node.js Implementation:**

```javascript
// 1. Create topic exchange
await channel.assertExchange('events', 'topic', { durable: true });

// 2. Bind queues with patterns
await channel.bindQueue('email.queue', 'events', 'order.*.email');
await channel.bindQueue('sms.queue', 'events', 'order.created.*');
await channel.bindQueue('analytics.queue', 'events', 'order.#');

// 3. Publish with different routing keys
channel.publish('events', 'order.created.email', Buffer.from(JSON.stringify({ type: 'email' })));
// Goes to: email.queue, sms.queue, analytics.queue

channel.publish('events', 'order.updated.sms', Buffer.from(JSON.stringify({ type: 'sms' })));
// Goes to: analytics.queue only
```

**When to Use:**
- ✅ Complex routing logic
- ✅ Hierarchical message types
- ✅ Flexible subscription patterns

---

#### **4. Headers Exchange**

Routes messages based on **message headers** instead of routing keys.

**Node.js Implementation:**

```javascript
// 1. Create headers exchange
await channel.assertExchange('tasks', 'headers', { durable: true });

// 2. Bind queues with header matching
await channel.bindQueue('urgent.queue', 'tasks', '', {
  'x-match': 'all', // Must match ALL headers
  'priority': 'high',
  'type': 'email'
});

// 3. Publish with headers
channel.publish('tasks', '', Buffer.from(JSON.stringify({ orderId: '123' })), {
  persistent: true,
  headers: { priority: 'high', type: 'email' }
});
// Goes to: urgent.queue
```

**When to Use:**
- ✅ Route based on multiple attributes
- ✅ Complex filtering logic

---

### ✅ Acknowledgements & Reliability

#### **Manual Acknowledgements**

Ensure messages aren't lost if consumer crashes.

```javascript
await channel.consume('queue', (msg) => {
  try {
    processMessage(msg);
    channel.ack(msg); // ✅ Success - remove from queue
  } catch (error) {
    channel.nack(msg, false, false); // ❌ Failure - send to DLQ
  }
}, { noAck: false });
```

**Acknowledgement Options:**

| Method | Description | Requeue | Use Case |
|--------|-------------|---------|----------|
| `ack(msg)` | Success | No | Message processed successfully |
| `nack(msg, false, true)` | Failure | Yes | Temporary error, retry |
| `nack(msg, false, false)` | Failure | No | Permanent error, send to DLQ |

---

### 🚨 Advanced Features

#### **1. Dead Letter Queue (DLQ)**

Stores messages that **failed processing** for manual inspection.

```javascript
// Create main queue with DLQ configuration
await channel.assertQueue('email.queue', {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': 'dlx.exchange',
    'x-dead-letter-routing-key': 'email.dlq'
  }
});

// Create DLX and DLQ
await channel.assertExchange('dlx.exchange', 'direct', { durable: true });
await channel.assertQueue('email.dlq', { durable: true });
await channel.bindQueue('email.dlq', 'dlx.exchange', 'email.dlq');

// When message fails
channel.nack(msg, false, false); // Goes to email.dlq
```

#### **2. Prefetch (Fair Dispatch)**

Limits **unacknowledged messages** per consumer.

```javascript
// Set prefetch to 1 (process one message at a time)
await channel.prefetch(1);

// With prefetch=1:
// Fast consumers get more messages
// Slow consumers don't get overwhelmed
// Fair distribution based on processing speed
```

#### **3. Message TTL (Time To Live)**

Messages **expire** after a certain time.

```javascript
// Queue-level TTL
await channel.assertQueue('temp.queue', {
  durable: true,
  arguments: { 'x-message-ttl': 60000 } // 60 seconds
});

// Message-level TTL
channel.publish('exchange', 'key', Buffer.from('message'), {
  expiration: '30000' // 30 seconds
});
```

#### **4. Priority Queues**

Process **high-priority messages first**.

```javascript
// Create priority queue
await channel.assertQueue('priority.queue', {
  durable: true,
  arguments: { 'x-max-priority': 10 }
});

// Publish with priority
channel.publish('exchange', 'key', Buffer.from('urgent'), {
  priority: 10 // High priority
});
```

---

### 💻 Node.js Implementation Patterns

#### **Pattern 1: Singleton Connection**

```javascript
// connection.js
let connection = null;
let channel = null;

async function connect(url) {
  if (connection) return connection;
  connection = await amqp.connect(url);
  channel = await connection.createChannel();
  return connection;
}

function getChannel() {
  if (!channel) throw new Error('Not connected');
  return channel;
}

module.exports = { connect, getChannel };
```

#### **Pattern 2: Reusable Publisher**

```javascript
// publisher.js
const { getChannel } = require('./connection');

async function publishMessage(exchange, routingKey, message) {
  const channel = getChannel();
  await channel.assertExchange(exchange, 'direct', { durable: true });
  channel.publish(
    exchange,
    routingKey,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
}

module.exports = { publishMessage };
```

#### **Pattern 3: Reusable Consumer**

```javascript
// consumer.js
const { getChannel } = require('./connection');

async function consumeMessages(queue, onMessage) {
  const channel = getChannel();
  await channel.assertQueue(queue, { durable: true });
  await channel.prefetch(1);
  
  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      const data = JSON.parse(msg.content.toString());
      const success = await onMessage(data);
      if (success) {
        channel.ack(msg);
      } else {
        channel.nack(msg, false, false);
      }
    } catch (error) {
      channel.nack(msg, false, false);
    }
  }, { noAck: false });
}

module.exports = { consumeMessages };
```

---

### 🎯 Best Practices

1. **Always Use Durable Queues & Exchanges**
   ```javascript
   await channel.assertQueue('queue', { durable: true });
   await channel.assertExchange('exchange', 'direct', { durable: true });
   ```

2. **Always Use Persistent Messages**
   ```javascript
   channel.publish('exchange', 'key', buffer, { persistent: true });
   ```

3. **Always Use Manual Acknowledgements**
   ```javascript
   await channel.consume('queue', handler, { noAck: false });
   ```

4. **Always Configure DLQ**
   ```javascript
   arguments: {
     'x-dead-letter-exchange': 'dlx.exchange',
     'x-dead-letter-routing-key': 'queue.dlq'
   }
   ```

5. **Set Prefetch for Fair Dispatch**
   ```javascript
   await channel.prefetch(1);
   ```

6. **Handle Connection Errors**
   ```javascript
   connection.on('error', (err) => {
     console.error('Connection error:', err);
     reconnect();
   });
   ```

7. **Graceful Shutdown**
   ```javascript
   process.on('SIGINT', async () => {
     await channel.close();
     await connection.close();
     process.exit(0);
   });
   ```

---

### 📊 Exchange Type Comparison

| Feature | Direct | Fanout | Topic | Headers |
|---------|--------|--------|-------|---------|
| **Routing** | Exact match | Broadcast | Pattern match | Header match |
| **Routing Key** | Required | Ignored | Required | Ignored |
| **Use Case** | Specific routing | Broadcast | Complex routing | Multi-criteria |
| **Performance** | Fast | Fastest | Moderate | Slowest |
| **Complexity** | Low | Lowest | Medium | High |

---

### 🚀 Quick Reference

```javascript
// Connect
const connection = await amqp.connect('amqp://localhost');
const channel = await connection.createChannel();

// Create exchange
await channel.assertExchange('name', 'type', { durable: true });

// Create queue
await channel.assertQueue('name', { durable: true });

// Bind queue
await channel.bindQueue('queue', 'exchange', 'routing.key');

// Publish
channel.publish('exchange', 'key', Buffer.from(JSON.stringify(data)), { persistent: true });

// Consume
await channel.consume('queue', (msg) => {
  const data = JSON.parse(msg.content.toString());
  channel.ack(msg);
}, { noAck: false });

// Close
await channel.close();
await connection.close();
```

---

## 📚 Additional Resources

- [RabbitMQ Official Documentation](https://www.rabbitmq.com/documentation.html)
- [amqplib GitHub Repository](https://github.com/amqp-node/amqplib)
- [Express.js Documentation](https://expressjs.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 📝 License

This project is open-source and available under the ISC License.

---

## 🤝 Contributing

This is a boilerplate project designed to be copied and extended. Feel free to:
- Add new services
- Implement additional RabbitMQ patterns (fanout, topic exchanges)
- Add unit and integration tests
- Improve error handling
- Add monitoring and logging

---

## ✨ Summary

This boilerplate provides a **production-ready foundation** for building RabbitMQ-based microservices. It demonstrates:

✅ Proper message broker integration  
✅ Error handling and recovery  
✅ Clean, reusable code architecture  
✅ Real-world patterns (DLQ, ack/nack, prefetch)  
✅ Comprehensive documentation  

**Copy, extend, and build amazing distributed systems!** 🚀
