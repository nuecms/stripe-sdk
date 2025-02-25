import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stripeSdk } from '../src/lib/sdk';
import { RedisCacheProvider } from '@nuecms/sdk-builder';
import Redis from 'ioredis';

describe('Stripe SDK Tests', () => {
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

  it('should initialize SDK correctly', () => {
    expect(sdk).toBeDefined();
    expect(typeof sdk.r).toBe('function');
  });

  it('should create a payment intent', async () => {
    const mockPaymentIntentResponse = {
      id: 'pi_mockPaymentIntentId',
      object: 'payment_intent',
      amount: 10000,
      currency: 'usd',
      status: 'requires_payment_method'
    };

    vi.spyOn(sdk, 'createPaymentIntent').mockResolvedValue(mockPaymentIntentResponse);

    const response = await sdk.createPaymentIntent({
      amount: 10000,
      currency: 'usd'
    });

    expect(response.id).toBe('pi_mockPaymentIntentId');
    expect(response.status).toBe('requires_payment_method');
  });

  it('should get a payment intent', async () => {
    const mockPaymentIntentResponse = {
      id: 'pi_mockPaymentIntentId',
      object: 'payment_intent',
      amount: 10000,
      currency: 'usd',
      status: 'succeeded'
    };

    vi.spyOn(sdk, 'getPaymentIntent').mockResolvedValue(mockPaymentIntentResponse);

    const response = await sdk.getPaymentIntent({ payment_intent_id: 'pi_mockPaymentIntentId' });

    expect(response.id).toBe('pi_mockPaymentIntentId');
    expect(response.status).toBe('succeeded');
  });

  it('should confirm a payment intent', async () => {
    const mockPaymentIntentResponse = {
      id: 'pi_mockPaymentIntentId',
      object: 'payment_intent',
      amount: 10000,
      currency: 'usd',
      status: 'succeeded'
    };

    vi.spyOn(sdk, 'confirmPaymentIntent').mockResolvedValue(mockPaymentIntentResponse);

    const response = await sdk.confirmPaymentIntent({
      payment_intent_id: 'pi_mockPaymentIntentId',
      payment_method: 'pm_card_visa'
    });

    expect(response.id).toBe('pi_mockPaymentIntentId');
    expect(response.status).toBe('succeeded');
  });

  it('should create a refund', async () => {
    const mockRefundResponse = {
      id: 're_mockRefundId',
      object: 'refund',
      amount: 10000,
      currency: 'usd',
      status: 'succeeded'
    };

    vi.spyOn(sdk, 'createRefund').mockResolvedValue(mockRefundResponse);

    const response = await sdk.createRefund({
      payment_intent: 'pi_mockPaymentIntentId',
      amount: 10000
    });

    expect(response.id).toBe('re_mockRefundId');
    expect(response.status).toBe('succeeded');
  });

  it('should create a customer', async () => {
    const mockCustomerResponse = {
      id: 'cus_mockCustomerId',
      object: 'customer',
      email: 'customer@example.com',
      name: 'Test Customer'
    };

    vi.spyOn(sdk, 'createCustomer').mockResolvedValue(mockCustomerResponse);

    const response = await sdk.createCustomer({
      email: 'customer@example.com',
      name: 'Test Customer'
    });

    expect(response.id).toBe('cus_mockCustomerId');
    expect(response.email).toBe('customer@example.com');
  });
});
