import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stripeSdk, V1 } from '../src/lib/sdk';
import { RedisCacheProvider } from '@nuecms/sdk-builder';
import Redis from 'ioredis';

describe('Stripe Checkout Session Tests', () => {
  const mockConfig = {
    apiKey: process.env.VITE_STRIPE_API_KEY || 'sk_test_mockApiKey',
    cacheProvider: new RedisCacheProvider(new Redis()),
  };

  let sdk: ReturnType<typeof stripeSdk>;

  beforeEach(() => {
    sdk = stripeSdk(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a checkout session', async () => {
    const mockCheckoutSession: V1.CheckoutSession = {
      id: 'cs_test_mockCheckoutSessionId',
      object: 'checkout.session',
      cancel_url: 'https://example.com/cancel',
      mode: 'payment',
      payment_status: 'unpaid',
      success_url: 'https://example.com/success',
      url: 'https://checkout.stripe.com/pay/cs_test_mockCheckoutSessionId'
    };

    vi.spyOn(sdk, 'createCheckoutSession').mockResolvedValue(mockCheckoutSession);

    const response = await sdk.createCheckoutSession({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_mockPriceId',
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel'
    });

    expect(response.id).toBe('cs_test_mockCheckoutSessionId');
    expect(response.mode).toBe('payment');
    expect(response.url).toBeDefined();
  });

  it('should retrieve a checkout session', async () => {
    const mockCheckoutSession: V1.CheckoutSession = {
      id: 'cs_test_mockCheckoutSessionId',
      object: 'checkout.session',
      cancel_url: 'https://example.com/cancel',
      mode: 'payment',
      payment_status: 'paid',
      success_url: 'https://example.com/success',
    };

    vi.spyOn(sdk, 'getCheckoutSession').mockResolvedValue(mockCheckoutSession);

    const response = await sdk.getCheckoutSession({ id: 'cs_test_mockCheckoutSessionId' });

    expect(response.id).toBe('cs_test_mockCheckoutSessionId');
    expect(response.payment_status).toBe('paid');
  });

  it('should retrieve line items from a checkout session', async () => {
    const mockLineItems = {
      object: 'list',
      data: [
        {
          id: 'li_mockLineItemId',
          object: 'item',
          amount_subtotal: 2000,
          amount_total: 2000,
          currency: 'usd',
          description: 'T-shirt',
          price: {
            id: 'price_mockPriceId'
          },
          quantity: 1
        }
      ],
      has_more: false,
      url: '/v1/checkout/sessions/cs_test_mockCheckoutSessionId/line_items'
    };

    vi.spyOn(sdk, 'getCheckoutSessionLineItems').mockResolvedValue(mockLineItems);

    const response = await sdk.getCheckoutSessionLineItems({ id: 'cs_test_mockCheckoutSessionId' });

    expect(response.data[0].description).toBe('T-shirt');
    expect(response.data[0].amount_total).toBe(2000);
    expect(response.data[0].currency).toBe('usd');
  });

  it('should expire a checkout session', async () => {
    const mockCheckoutSession: V1.CheckoutSession = {
      id: 'cs_test_mockCheckoutSessionId',
      object: 'checkout.session',
      cancel_url: 'https://example.com/cancel',
      mode: 'payment',
      payment_status: 'unpaid',
      success_url: 'https://example.com/success',
      status: 'expired',
    };

    vi.spyOn(sdk, 'expireCheckoutSession').mockResolvedValue(mockCheckoutSession);

    const response = await sdk.expireCheckoutSession({ id: 'cs_test_mockCheckoutSessionId' });

    expect(response.id).toBe('cs_test_mockCheckoutSessionId');
    expect(response.status).toBe('expired');
  });
});
