# Stripe API v2 Overview

This document explains the key differences between Stripe's v1 and v2 APIs and how our SDK handles these differences, focusing on the officially available v2 endpoints.

## Currently Available v2 Endpoints

As of now, Stripe only provides a limited set of v2 endpoints in two namespaces:

### 1. Billing
- **Meter Events**: Track usage data for metered billing
- **Meter Event Adjustments**: Make adjustments to previously reported meter events
- **Meter Event Sessions**: Manage metered billing sessions
- **Meter Event Streams**: Define schemas for meter event data

### 2. Core
- **Event Destinations**: Configure webhook endpoints to receive events
- **Events**: Access event data

## Key Differences Between v1 and v2 APIs

| Feature | API v1 | API v2 |
|---------|--------|--------|
| **Access APIs** | Use secret and restricted access keys | Only accessible with secret keys |
| **Data Format** | Requests use form encoding (`application/x-www-form-urlencoded`), responses use JSON | Both requests and responses use JSON encoding (`application/json`) |
| **Test Environment** | Supports both Sandboxes and test mode | Supports Sandboxes only, test mode is unsupported |
| **Idempotency** | Returns previously stored request if already processed | Retries failed requests without producing side effects |
| **Events** | Most include a snapshot of an API object | All are "thin events" with minimal payload |
| **Pagination** | Uses `starting_after`, `ending_before`, and `has_more` | Uses `previous_page_url` and `next_page_url` with page tokens |
| **List Consistency** | Top-level lists are immediately consistent | Lists are eventually consistent by default |
| **Expansions** | Supports `expand` parameter | Doesn't support `expand`, some APIs may use `include` parameter |
| **Metadata** | Remove key-value pair by setting value to empty string | Remove key-value pair by setting value to `null` |

## How Our SDK Handles v2 Endpoints

Our SDK provides seamless support for both v1 and v2 endpoints while respecting their differences:

### Naming Convention

All v2 endpoint methods are prefixed with `v2` to clearly distinguish them:

```typescript
// v1 endpoint
await sdk.createPaymentIntent({ ... });

// v2 endpoint
await sdk.v2CreateMeterEvent({ ... });
```

### Content-Type Headers

The SDK automatically sets the appropriate Content-Type header:

- For v1 endpoints: `application/x-www-form-urlencoded`
- For v2 endpoints: `application/json`

## Working with v2 Meter Events

Stripe's v2 Billing endpoints allow you to track usage data for metered billing:

```typescript
// Create a meter event
const meterEvent = await sdk.v2CreateMeterEvent({
  meter_event_stream: 'mes_123456789',
  measurement_time: Math.floor(Date.now() / 1000),
  payload: {
    quantity: 5,
    operation: 'api_call'
  }
});

// Create a meter event session
const session = await sdk.v2CreateMeterEventSession({
  meter_event_stream: 'mes_123456789'
});

// Update a meter event session (e.g., to close it)
const updatedSession = await sdk.v2UpdateMeterEventSession({
  meter_event_session_id: session.id,
  status: 'closed'
});
```

## Working with v2 Event Destinations

Event Destinations allow you to configure webhook endpoints to receive events:

```typescript
// Create an event destination (webhook endpoint)
const destination = await sdk.v2CreateEventDestination({
  endpoint_url: 'https://example.com/webhook',
  events_types: ['billing.meter_event.created', 'billing.meter_event_adjustment.created'],
  description: 'Meter event webhook'
});

// Update an event destination
const updatedDestination = await sdk.v2UpdateEventDestination({
  id: destination.id,
  description: 'Updated meter event webhook'
});

// Enable or disable an event destination
await sdk.v2EnableEventDestination({ id: destination.id });
await sdk.v2DisableEventDestination({ id: destination.id });

// Test an event destination with a ping
const pingResult = await sdk.v2PingEventDestination({ id: destination.id });
console.log(`Ping status: ${pingResult.status}`);

// Delete an event destination
const deletedDestination = await sdk.v2DeleteEventDestination({
  id: destination.id
});
```

## Working with v2 Events

Access events triggered by various actions:

```typescript
// Get a specific event
const event = await sdk.v2GetEvent({
  event_id: 'evt_123456789'
});

// List events
const events = await sdk.v2ListEvents({
  limit: 10
});

// Paginate through events
if (events.next_page_url) {
  const parsedUrl = new URL(events.next_page_url);
  const pageToken = parsedUrl.searchParams.get('page_token');

  const nextPage = await sdk.v2ListEvents({
    limit: 10,
    page_token: pageToken
  });
}
```

## TypeScript Support

Our SDK provides strong typing for v2 endpoints with the `V2` namespace:

```typescript
import { stripeSdk, V2 } from '@nuecms/stripe-sdk';

// Create a typed meter event
const meterEvent: V2.MeterEvent = await sdk.v2CreateMeterEvent({ ... });

// Work with events
const event: V2.Event = await sdk.v2GetEvent({ ... });

// Work with paginated responses
const eventsList: V2.PaginationResponse<V2.Event> = await sdk.v2ListEvents({ ... });
```

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe API Versioning](https://stripe.com/docs/upgrades)
- [Stripe Developers Dashboard](https://dashboard.stripe.com/developers)
