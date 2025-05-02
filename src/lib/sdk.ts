import { sdkBuilder, SdkBuilderConfig, FetchContext, RedisCacheProvider, CacheProvider } from '@nuecms/sdk-builder';
import { randomUUID } from 'crypto';
import { debuglog } from 'util';
const debug = debuglog('stripe-sdk');

/**
 * Configuration options for Stripe SDK
 *
 * @property apiKey - Stripe API key (sk_test_xxx or sk_live_xxx)
 * @property endpoint - Optional custom API endpoint (defaults to https://api.stripe.com)
 * @property timeout - Request timeout in milliseconds (defaults to 10000)
 * @property maxRetries - Maximum number of retries for failed requests (defaults to 0)
 * @property apiVersion - Stripe API version to use (defaults to latest stable version)
 * @property cacheProvider - Optional cache provider for caching API responses
 * @property customResponseTransformer - Optional function to transform API responses
 */
interface StripeSDKConfig {
  apiKey: string;
  endpoint?: string;
  timeout?: number;
  maxRetries?: number;
  apiVersion?: string;
  cacheProvider?: CacheProvider;
  customResponseTransformer?: (response: any) => any;
}

export {
  RedisCacheProvider,
  type CacheProvider,
  type StripeSDKConfig,
}

export type StripeSDK = ReturnType<typeof sdkBuilder>

/**
 * Internal configuration context for SDK
 *
 * @property apiKey - Stripe API key
 * @property timeout - Request timeout in milliseconds
 * @property endpoint - API endpoint URL
 * @property apiVersion - Stripe API version
 */
export type ContextConfig = {
  [key: string]: any;
  apiKey: string;
  timeout: number;
  endpoint: string;
  apiVersion: string;
}

const defaultEndpoint = 'https://api.stripe.com';
const defaultApiVersion = '2025-04-30.basil';

const createRequestId = () => {
  return randomUUID().replace(/-/g, '');
}

const customResponseTransformer = (responseData: any, context: FetchContext, response: Response) => {
  debug('customResponseTransformer', responseData, context, '\n Response headers: \n', Object.fromEntries(response.headers.entries()));
  return responseData;
}

export function stripeSdk(config: StripeSDKConfig): StripeSDK {
  const sdkConfig: SdkBuilderConfig = {
    baseUrl: config.endpoint || defaultEndpoint,
    cacheProvider: config.cacheProvider,
    maxRetries: config.maxRetries ?? 0,
    config: {
      apiKey: config.apiKey,
      timeout: config.timeout || 10000,
      endpoint: config.endpoint || defaultEndpoint,
      apiVersion: config.apiVersion || defaultApiVersion,
    } as ContextConfig,
    customResponseTransformer: config.customResponseTransformer || customResponseTransformer,
    validateStatus: (status: number) => {
      return status >= 200 && status < 500;
    }
  };
  const sdk: StripeSDK = sdkBuilder(sdkConfig);

  // Add middleware to determine API version from the endpoint path
  const isV2Endpoint = (path: string) => path.startsWith('/v2/');

  // Request interceptor to set appropriate headers based on API version
  sdk.rx('reqInterceptor', async (config: Record<string, any>, options: any = {}) => {
    const requestId = createRequestId();
    const isV2 = isV2Endpoint(options.path);

    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${config.apiKey}`,
      'Stripe-Version': config.apiVersion || defaultApiVersion,
      'Idempotency-Key': requestId,
    };

    // Set content type based on API version
    if (isV2) {
      options.contentType = 'application/json';
    } else {
      options.contentType = 'application/x-www-form-urlencoded';
    }

    return options;
  });

  // Register v1 endpoints
  registerV1Endpoints(sdk);

  // Register v2 endpoints
  registerV2Endpoints(sdk);

  return sdk;
}

function registerV1Endpoints(sdk: StripeSDK): void {
  // Balance
  sdk.r('getBalance', '/v1/balance', 'GET');
  sdk.r('getBalanceTransaction', '/v1/balance/history/{transaction_id}', 'GET');

  // Charges
  sdk.r('createCharge', '/v1/charges', 'POST');
  sdk.r('getCharge', '/v1/charges/{charge_id}', 'GET');
  sdk.r('updateCharge', '/v1/charges/{charge_id}', 'POST');
  sdk.r('captureCharge', '/v1/charges/{charge_id}/capture', 'POST');

  // Customers
  sdk.r('createCustomer', '/v1/customers', 'POST');
  sdk.r('getCustomer', '/v1/customers/{customer_id}', 'GET');
  sdk.r('updateCustomer', '/v1/customers/{customer_id}', 'POST');
  sdk.r('deleteCustomer', '/v1/customers/{customer_id}', 'DELETE');
  sdk.r('listCustomers', '/v1/customers', 'GET');

  // Payment Methods
  sdk.r('createPaymentMethod', '/v1/payment_methods', 'POST');
  sdk.r('getPaymentMethod', '/v1/payment_methods/{payment_method_id}', 'GET');
  sdk.r('updatePaymentMethod', '/v1/payment_methods/{payment_method_id}', 'POST');
  sdk.r('attachPaymentMethod', '/v1/payment_methods/{payment_method_id}/attach', 'POST');
  sdk.r('detachPaymentMethod', '/v1/payment_methods/{payment_method_id}/detach', 'POST');

  // Payment Intents
  sdk.r('createPaymentIntent', '/v1/payment_intents', 'POST');
  sdk.r('getPaymentIntent', '/v1/payment_intents/{payment_intent_id}', 'GET');
  sdk.r('updatePaymentIntent', '/v1/payment_intents/{payment_intent_id}', 'POST');
  sdk.r('confirmPaymentIntent', '/v1/payment_intents/{payment_intent_id}/confirm', 'POST');
  sdk.r('cancelPaymentIntent', '/v1/payment_intents/{payment_intent_id}/cancel', 'POST');
  sdk.r('capturePaymentIntent', '/v1/payment_intents/{payment_intent_id}/capture', 'POST');

  // Setup Intents
  sdk.r('createSetupIntent', '/v1/setup_intents', 'POST');
  sdk.r('getSetupIntent', '/v1/setup_intents/{setup_intent_id}', 'GET');
  sdk.r('updateSetupIntent', '/v1/setup_intents/{setup_intent_id}', 'POST');
  sdk.r('confirmSetupIntent', '/v1/setup_intents/{setup_intent_id}/confirm', 'POST');
  sdk.r('cancelSetupIntent', '/v1/setup_intents/{setup_intent_id}/cancel', 'POST');

  // Refunds
  sdk.r('createRefund', '/v1/refunds', 'POST');
  sdk.r('getRefund', '/v1/refunds/{refund_id}', 'GET');
  sdk.r('updateRefund', '/v1/refunds/{refund_id}', 'POST');
  sdk.r('cancelRefund', '/v1/refunds/{refund_id}/cancel', 'POST');

  // Products
  sdk.r('createProduct', '/v1/products', 'POST');
  sdk.r('getProduct', '/v1/products/{product_id}', 'GET');
  sdk.r('updateProduct', '/v1/products/{product_id}', 'POST');
  sdk.r('deleteProduct', '/v1/products/{product_id}', 'DELETE');
  sdk.r('listProducts', '/v1/products', 'GET');

  // Prices
  sdk.r('createPrice', '/v1/prices', 'POST');
  sdk.r('getPrice', '/v1/prices/{price_id}', 'GET');
  sdk.r('updatePrice', '/v1/prices/{price_id}', 'POST');
  sdk.r('listPrices', '/v1/prices', 'GET');

  // Subscriptions
  sdk.r('createSubscription', '/v1/subscriptions', 'POST');
  sdk.r('getSubscription', '/v1/subscriptions/{subscription_id}', 'GET');
  sdk.r('updateSubscription', '/v1/subscriptions/{subscription_id}', 'POST');
  sdk.r('cancelSubscription', '/v1/subscriptions/{subscription_id}', 'DELETE');

  // Invoices
  sdk.r('createInvoice', '/v1/invoices', 'POST');
  sdk.r('getInvoice', '/v1/invoices/{invoice_id}', 'GET');
  sdk.r('updateInvoice', '/v1/invoices/{invoice_id}', 'POST');
  sdk.r('finalizeInvoice', '/v1/invoices/{invoice_id}/finalize', 'POST');
  sdk.r('payInvoice', '/v1/invoices/{invoice_id}/pay', 'POST');
  sdk.r('voidInvoice', '/v1/invoices/{invoice_id}/void', 'POST');

  // Webhooks
  sdk.r('constructEvent', '/v1/webhook/construct-event', 'POST'); // This is not a real Stripe endpoint, just for handling webhook events

  // Checkout Sessions
  sdk.r('createCheckoutSession', '/v1/checkout/sessions', 'POST');
  sdk.r('getCheckoutSession', '/v1/checkout/sessions/{id}', 'GET');
  sdk.r('listCheckoutSessions', '/v1/checkout/sessions', 'GET');
  sdk.r('expireCheckoutSession', '/v1/checkout/sessions/{id}/expire', 'POST');
  sdk.r('getCheckoutSessionLineItems', '/v1/checkout/sessions/{id}/line_items', 'GET');
}

function registerV2Endpoints(sdk: StripeSDK): void {
  // V2 Billing - Meter Events
  sdk.r('v2CreateMeterEvent', '/v2/billing/meter_events', 'POST');
  sdk.r('v2GetMeterEvent', '/v2/billing/meter_events/{meter_event_id}', 'GET');
  sdk.r('v2ListMeterEvents', '/v2/billing/meter_events', 'GET');

  // V2 Billing - Meter Event Adjustments
  sdk.r('v2CreateMeterEventAdjustment', '/v2/billing/meter_event_adjustments', 'POST');
  sdk.r('v2GetMeterEventAdjustment', '/v2/billing/meter_event_adjustments/{meter_event_adjustment_id}', 'GET');
  sdk.r('v2ListMeterEventAdjustments', '/v2/billing/meter_event_adjustments', 'GET');

  // V2 Billing - Meter Event Session
  sdk.r('v2CreateMeterEventSession', '/v2/billing/meter_event_session', 'POST');

  // V2 Billing - Meter Event Stream
  sdk.r('v2CreateMeterEventStream', '/v2/billing/meter_event_stream', 'POST');

  // V2 Core - Event Destinations - Updated to match official Stripe API
  sdk.r('v2CreateEventDestination', '/v2/core/event_destinations', 'POST');
  sdk.r('v2GetEventDestination', '/v2/core/event_destinations/{id}', 'GET'); // Changed from event_destination_id to id
  sdk.r('v2UpdateEventDestination', '/v2/core/event_destinations/{id}', 'POST'); // Changed from event_destination_id to id
  sdk.r('v2ListEventDestinations', '/v2/core/event_destinations', 'GET');
  sdk.r('v2DeleteEventDestination', '/v2/core/event_destinations/{id}', 'DELETE'); // Changed from event_destination_id to id

  // Added missing endpoints
  sdk.r('v2DisableEventDestination', '/v2/core/event_destinations/{id}/disable', 'POST');
  sdk.r('v2EnableEventDestination', '/v2/core/event_destinations/{id}/enable', 'POST');
  sdk.r('v2PingEventDestination', '/v2/core/event_destinations/{id}/ping', 'POST');

  // V2 Core - Events
  sdk.r('v2GetEvent', '/v2/core/events/{event_id}', 'GET');
  sdk.r('v2ListEvents', '/v2/core/events', 'GET');
}

// Pagination helper for v2 endpoints
export function extractPageToken(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get('page_token');
  } catch (e) {
    return null;
  }
}

// Export specific types for v1 and v2 endpoints
export namespace V1 {
  /**
   * Stripe Payment Intent object
   *
   * @property id - Unique identifier for the payment intent
   * @property object - Object type (always 'payment_intent')
   * @property amount - Amount in smallest currency unit (e.g., cents for USD)
   * @property currency - Three-letter ISO currency code
   * @property status - Status of the payment intent (e.g., 'requires_payment_method', 'succeeded')
   */
  export interface PaymentIntent {
    id: string;
    object: 'payment_intent';
    amount: number;
    currency: string;
    status: string;
    // Add other properties as needed
  }

  /**
   * Stripe Customer object
   *
   * @property id - Unique identifier for the customer
   * @property object - Object type (always 'customer')
   * @property email - Customer's email address
   * @property name - Customer's name
   */
  export interface Customer {
    id: string;
    object: 'customer';
    email?: string;
    name?: string;
    // Add other properties as needed
  }

  /**
   * Stripe Checkout Session object
   *
   * @property id - Unique identifier for the checkout session
   * @property object - Object type (always 'checkout.session')
   * @property cancel_url - URL to redirect customers when they cancel checkout
   * @property client_reference_id - Unique reference for the checkout session
   * @property customer - ID of the customer for the checkout session
   * @property line_items - Items purchased in the checkout session
   * @property mode - Payment mode of the checkout session (e.g., 'payment', 'subscription')
   * @property payment_intent - ID of the payment intent created for the checkout session
   * @property payment_status - Status of the payment (e.g., 'paid', 'unpaid')
   * @property success_url - URL to redirect customers after successful checkout
   * @property url - URL to the checkout session
   */
  export interface CheckoutSession {
    id: string;
    object: 'checkout.session';
    cancel_url: string;
    client_reference_id?: string;
    customer?: string;
    line_items?: LineItem[];
    mode: 'payment' | 'setup' | 'subscription';
    payment_intent?: string;
    payment_status: 'paid' | 'unpaid' | 'no_payment_required';
    success_url: string;
    url?: string;
    // Add other properties as needed
  }

  /**
   * Line Item object for Checkout Sessions
   *
   * @property id - Unique identifier for the line item
   * @property object - Object type (always 'item')
   * @property amount_subtotal - Subtotal amount for the line item in smallest currency unit
   * @property amount_total - Total amount for the line item in smallest currency unit
   * @property currency - Three-letter ISO currency code
   * @property description - Description of the line item
   * @property price - ID of the price object
   * @property quantity - Quantity of the line item
   */
  export interface LineItem {
    id: string;
    object: 'item';
    amount_subtotal: number;
    amount_total: number;
    currency: string;
    description: string;
    price?: string;
    quantity?: number;
    // Add other properties as needed
  }

  // Add more types as needed
}

export namespace V2 {
  // Billing - Meter Event Types
  /**
   * Meter Event object for usage-based billing
   *
   * @property id - Unique identifier for the meter event
   * @property object - Object type (always 'billing.meter_event')
   * @property meter_event_stream - ID of the meter event stream this event belongs to
   * @property idempotency_key - Optional key for ensuring idempotency
   * @property measurement_time - Unix timestamp when the measurement was taken
   * @property payload - Custom payload data for the meter event
   */
  export interface MeterEvent {
    id: string;
    object: 'billing.meter_event';
    meter_event_stream: string;
    idempotency_key?: string;
    measurement_time: number;
    payload: Record<string, any>;
    // Add other properties as needed
  }

  /**
   * Meter Event Adjustment object for modifying previously reported meter events
   *
   * @property id - Unique identifier for the meter event adjustment
   * @property object - Object type (always 'billing.meter_event_adjustment')
   * @property meter_event - ID of the meter event being adjusted
   * @property reason - Reason for the adjustment
   * @property delta - Delta values for the adjustment
   */
  export interface MeterEventAdjustment {
    id: string;
    object: 'billing.meter_event_adjustment';
    meter_event: string;
    reason: string;
    delta: Record<string, any>;
    // Add other properties as needed
  }

  /**
   * Meter Event Session object for managing metered billing sessions
   *
   * @property id - Unique identifier for the meter event session
   * @property object - Object type (always 'billing.meter_event_session')
   * @property meter_event_stream - ID of the meter event stream this session belongs to
   * @property status - Status of the session (e.g., 'open', 'closed')
   */
  export interface MeterEventSession {
    id: string;
    object: 'billing.meter_event_session';
    meter_event_stream: string;
    status: string;
    // Add other properties as needed
  }

  /**
   * Meter Event Stream object for defining schemas for meter event data
   *
   * @property id - Unique identifier for the meter event stream
   * @property object - Object type (always 'billing.meter_event_stream')
   * @property display_name - Display name for the meter event stream
   * @property schema - JSON schema for validating meter event payloads
   */
  export interface MeterEventStream {
    id: string;
    object: 'billing.meter_event_stream';
    display_name: string;
    schema: Record<string, any>;
    // Add other properties as needed
  }

  // Core - Event Types
  /**
   * Event object for Stripe events
   *
   * @property id - Unique identifier for the event
   * @property object - Object type (always 'core.event')
   * @property api_version - API version used to generate the event
   * @property created - Unix timestamp when the event was created
   * @property data - Event data containing the relevant object
   * @property type - Type of event (e.g., 'billing.meter_event.created')
   */
  export interface Event {
    id: string;
    object: 'core.event';
    api_version: string;
    created: number;
    data: {
      object: Record<string, any>;
    };
    type: string;
    // Add other properties as needed
  }

  /**
   * Event Destination object for webhook configuration
   *
   * @property id - Unique identifier for the event destination
   * @property object - Object type (always 'core.event_destination')
   * @property description - Optional description of the event destination
   * @property endpoint_url - URL where events will be sent
   * @property events_types - Array of event types to send to this destination
   * @property status - Status of the event destination (e.g., 'active', 'inactive')
   * @property enabled - Whether the event destination is enabled
   */
  export interface EventDestination {
    id: string;
    object: 'core.event_destination';
    description?: string;
    endpoint_url: string;
    events_types: string[];
    status: string;
    enabled: boolean;
    // Add other properties as needed
  }

  /**
   * Generic pagination response for v2 list endpoints
   *
   * @property data - Array of objects returned by the API
   * @property object - Object type (always 'list')
   * @property next_page_url - URL for the next page of results (if available)
   * @property previous_page_url - URL for the previous page of results (if available)
   */
  export interface PaginationResponse<T> {
    data: T[];
    object: 'list';
    next_page_url?: string;
    previous_page_url?: string;
  }
}
