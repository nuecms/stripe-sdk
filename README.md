# Stripe SDK

> WIP

A flexible and lightweight SDK for building Stripe integrations with dynamic endpoints, caching, and response transformations.

[![npm](https://img.shields.io/npm/v/@nuecms/stripe-sdk)](https://www.npmjs.com/package/@nuecms/stripe-sdk)
[![GitHub](https://img.shields.io/github/license/nuecms/stripe-sdk)](https://www.github.com/nuecms/stripe-sdk)
[![GitHub issues](https://img.shields.io/github/issues/nuecms/stripe-sdk)](https://www.github.com/nuecms/stripe-sdk/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/nuecms/stripe-sdk)](https://www.github.com/nuecms/stripe-sdk/pulls)

---

## Introduction

Stripe SDK for Node.js provides the ability to call Stripe REST API from a Node.js server.
It includes making API requests to Stripe servers, handling payments, customers, subscriptions, and supporting all v1 endpoints as well as the officially available v2 endpoints for metered billing and events.

Based on the [Stripe REST API](https://stripe.com/docs/api), supporting both v1 and v2 endpoints.

## Requirements

- Node.js >= 18.0.0

---

## Features

- Pre-configured API endpoints for Stripe's platform
- Support for both v1 and officially available v2 endpoints with appropriate content types
- Redis and in-memory caching capabilities
- Easy extensibility
- Convenient methods for Payment Intents, Customers, Products, and more
- TypeScript support with namespaced types for API versions

---

## Table of Contents

- [Stripe SDK](#stripe-sdk)
  - [Introduction](#introduction)
  - [Requirements](#requirements)
  - [Features](#features)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
    - [1. Import and Initialize the SDK](#1-import-and-initialize-the-sdk)
    - [2. Register API Endpoints](#2-register-api-endpoints)
    - [3. Make API Calls](#3-make-api-calls)
    - [4. Using V2 API Endpoints](#4-using-v2-api-endpoints)
  - [Environment Configuration](#environment-configuration)
  - [Usage Examples](#usage-examples)
    - [Creating a Payment Intent (v1)](#creating-a-payment-intent-v1)
    - [Managing Customers (v1)](#managing-customers-v1)
    - [Working with Meter Events (v2)](#working-with-meter-events-v2)
    - [Managing Event Destinations (v2)](#managing-event-destinations-v2)
  - [API Versions](#api-versions)
  - [Contributing](#contributing)
  - [License](#license)

---

## Installation

Install the SDK using `pnpm` or `yarn`:

```bash
pnpm add @nuecms/stripe-sdk
# or
yarn add @nuecms/stripe-sdk
```

---

## Quick Start

### 1. Import and Initialize the SDK

```typescript
import { stripeSdk } from '@nuecms/stripe-sdk';

const sdk = stripeSdk({
  apiKey: 'your-stripe-api-key', // sk_test_... or sk_live_...
  apiVersion: '2023-10-16', // Optional, defaults to latest version
});
```

### 2. Register API Endpoints

The SDK comes with pre-registered endpoints, but you can add custom ones:

```typescript
sdk.r('customEndpoint', '/v1/custom/path', 'POST');
```

### 3. Make API Calls

```typescript
const paymentIntent = await sdk.createPaymentIntent({
  amount: 2000,   // $20.00 in cents
  currency: 'usd',
  payment_method_types: ['card']
});
console.log(paymentIntent.id);
```

### 4. Using V2 API Endpoints

All V2 API endpoints are prefixed with `v2` in the method name:

```typescript
// Create a meter event for usage-based billing
const meterEvent = await sdk.v2CreateMeterEvent({
  meter_event_stream: 'mes_123456789',
  measurement_time: Math.floor(Date.now() / 1000),
  payload: { quantity: 5 }
});
```

---

## Environment Configuration

The SDK can be configured using environment variables. Copy the `env.example` file to `.env` and modify as needed:

```bash
cp env.example .env
```

Required environment variables:

- `VITE_STRIPE_API_KEY`: Your Stripe Secret API Key (starts with `sk_test_` or `sk_live_`)



Example usage:

```typescript
import { stripeSdk, RedisCacheProvider } from '@nuecms/stripe-sdk';
import Redis from 'ioredis';

// Initialize with environment variables
const redis = new Redis(process.env.REDIS_URL);
const sdk = stripeSdk({
  apiKey: process.env.VITE_STRIPE_API_KEY,
});
```

---

## Usage Examples

### Creating a Payment Intent (v1)

```typescript
// Create a payment intent for $25
const paymentIntent = await sdk.createPaymentIntent({
  amount: 2500,
  currency: 'usd',
  payment_method_types: ['card'],
  description: 'Product purchase'
});

// Later, confirm the payment intent with a payment method
const confirmedIntent = await sdk.confirmPaymentIntent({
  payment_intent_id: paymentIntent.id,
  payment_method: 'pm_card_visa'
});
```

### Managing Customers (v1)

```typescript
// Create a customer
const customer = await sdk.createCustomer({
  email: 'customer@example.com',
  name: 'Jane Smith'
});

// Attach a payment method to the customer
await sdk.attachPaymentMethod({
  payment_method_id: 'pm_card_visa',
  customer: customer.id
});

// Create a subscription
const subscription = await sdk.createSubscription({
  customer: customer.id,
  items: [{ price: 'price_premium_monthly' }]
});
```

### Working with Meter Events (v2)

```typescript
// Create a meter event stream to define the schema
const stream = await sdk.v2CreateMeterEventStream({
  display_name: 'API Calls',
  schema: {
    type: 'object',
    properties: {
      quantity: { type: 'number' },
      operation: { type: 'string' }
    },
    required: ['quantity']
  }
});

// Create a meter event session
const session = await sdk.v2CreateMeterEventSession({
  meter_event_stream: stream.id
});

// Create a meter event
const event = await sdk.v2CreateMeterEvent({
  meter_event_stream: stream.id,
  measurement_time: Math.floor(Date.now() / 1000),
  payload: {
    quantity: 1,
    operation: 'get_data'
  }
});

// Close the session when done
await sdk.v2UpdateMeterEventSession({
  meter_event_session_id: session.id,
  status: 'closed'
});
```

### Managing Event Destinations (v2)

```typescript
// Create an event destination for webhooks
const destination = await sdk.v2CreateEventDestination({
  endpoint_url: 'https://example.com/webhook',
  events_types: ['billing.meter_event.created'],
  description: 'Meter event webhook'
});

// List all event destinations
const destinations = await sdk.v2ListEventDestinations({
  limit: 10
});

// Enable/disable an event destination
await sdk.v2EnableEventDestination({ id: destination.id });
await sdk.v2DisableEventDestination({ id: destination.id });

// Test an event destination with a ping
const pingResult = await sdk.v2PingEventDestination({ id: destination.id });
if (pingResult.status === 'succeeded') {
  console.log('Webhook endpoint is reachable');
}

// Delete an event destination when no longer needed
await sdk.v2DeleteEventDestination({ id: destination.id });
```

## API Versions

Stripe provides two API namespaces with different behaviors. Our SDK supports both:

- **v1 API**: Most common endpoints using form-encoded requests
- **v2 API**: Limited set of newer endpoints with JSON requests/responses

Currently, the v2 API includes:
- **Billing**: Meter Events, Event Adjustments, Event Sessions, Event Streams
- **Core**: Events and Event Destinations

For detailed information about the differences between v1 and v2 APIs, see our [V2 API Overview](docs/v2-api-overview.md) document.

Key differences handled by our SDK:

- **Content Types**: v1 uses form-encoding, v2 uses JSON
- **Pagination**: v1 uses cursor-based, v2 uses page tokens
- **Features**: Different idempotency behavior, metadata handling, and more

---

## Contributing

We welcome contributions to improve this SDK! To get started:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-name`).
3. Commit your changes (`git commit -m "Add feature X"`).
4. Push to the branch (`git push origin feature-name`).
5. Open a pull request.

---

## License

This SDK is released under the **MIT License**. You're free to use, modify, and distribute this project. See the `LICENSE` file for more details.