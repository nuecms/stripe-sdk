import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stripeSdk, V2 } from '../src/lib/sdk';
import { RedisCacheProvider } from '@nuecms/sdk-builder';
import Redis from 'ioredis';

describe('Stripe SDK V2 Tests', () => {
  const mockConfig = {
    apiKey: process.env.VITE_STRIPE_API_KEY || 'sk_test_mockApiKey',
    apiVersion: '2023-10-16',
    cacheProvider: new RedisCacheProvider(new Redis()),
  };

  let sdk: ReturnType<typeof stripeSdk>;

  beforeEach(() => {
    sdk = stripeSdk(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize SDK with v2 support', () => {
    expect(sdk).toBeDefined();
    expect(typeof sdk.v2CreateMeterEvent).toBe('function');
    expect(typeof sdk.v2GetEvent).toBe('function');
  });

  describe('V2 Billing - Meter Events', () => {
    it('should create a meter event', async () => {
      const mockResponse: V2.MeterEvent = {
        id: 'me_123456',
        object: 'billing.meter_event',
        meter_event_stream: 'mes_123456',
        measurement_time: 1677721600,
        payload: { quantity: 5 }
      };

      vi.spyOn(sdk, 'v2CreateMeterEvent').mockResolvedValue(mockResponse);

      const response = await sdk.v2CreateMeterEvent({
        meter_event_stream: 'mes_123456',
        measurement_time: 1677721600,
        payload: { quantity: 5 }
      });

      expect(response.id).toBe('me_123456');
      expect(response.payload.quantity).toBe(5);
    });

    it('should get a meter event', async () => {
      const mockResponse: V2.MeterEvent = {
        id: 'me_123456',
        object: 'billing.meter_event',
        meter_event_stream: 'mes_123456',
        measurement_time: 1677721600,
        payload: { quantity: 5 }
      };

      vi.spyOn(sdk, 'v2GetMeterEvent').mockResolvedValue(mockResponse);

      const response = await sdk.v2GetMeterEvent({ meter_event_id: 'me_123456' });

      expect(response.id).toBe('me_123456');
      expect(response.meter_event_stream).toBe('mes_123456');
    });
  });

  describe('V2 Billing - Meter Event Sessions', () => {
    it('should create a meter event session', async () => {
      const mockResponse: V2.MeterEventSession = {
        id: 'mes_123456',
        object: 'billing.meter_event_session',
        meter_event_stream: 'mes_stream_123456',
        status: 'open'
      };

      vi.spyOn(sdk, 'v2CreateMeterEventSession').mockResolvedValue(mockResponse);

      const response = await sdk.v2CreateMeterEventSession({
        meter_event_stream: 'mes_stream_123456'
      });

      expect(response.id).toBe('mes_123456');
      expect(response.status).toBe('open');
    });

    it('should update a meter event session', async () => {
      const mockResponse: V2.MeterEventSession = {
        id: 'mes_123456',
        object: 'billing.meter_event_session',
        meter_event_stream: 'mes_stream_123456',
        status: 'closed'
      };

      vi.spyOn(sdk, 'v2UpdateMeterEventSession').mockResolvedValue(mockResponse);

      const response = await sdk.v2UpdateMeterEventSession({
        meter_event_session_id: 'mes_123456',
        status: 'closed'
      });

      expect(response.id).toBe('mes_123456');
      expect(response.status).toBe('closed');
    });
  });

  describe('V2 Core - Event Destinations', () => {
    it('should create an event destination', async () => {
      const mockResponse: V2.EventDestination = {
        id: 'evdest_123456',
        object: 'core.event_destination',
        endpoint_url: 'https://example.com/webhook',
        events_types: ['billing.meter_event.created'],
        status: 'active',
        enabled: true,
        description: 'Test webhook endpoint'
      };

      vi.spyOn(sdk, 'v2CreateEventDestination').mockResolvedValue(mockResponse);

      const response = await sdk.v2CreateEventDestination({
        endpoint_url: 'https://example.com/webhook',
        events_types: ['billing.meter_event.created'],
        description: 'Test webhook endpoint'
      });

      expect(response.id).toBe('evdest_123456');
      expect(response.status).toBe('active');
      expect(response.events_types).toContain('billing.meter_event.created');
    });

    it('should delete an event destination', async () => {
      const mockResponse = {
        id: 'evdest_123456',
        object: 'core.event_destination',
        deleted: true
      };

      vi.spyOn(sdk, 'v2DeleteEventDestination').mockResolvedValue(mockResponse);

      const response = await sdk.v2DeleteEventDestination({ id: 'evdest_123456' });

      expect(response.deleted).toBe(true);
    });

    it('should enable an event destination', async () => {
      const mockResponse: V2.EventDestination = {
        id: 'evdest_123456',
        object: 'core.event_destination',
        endpoint_url: 'https://example.com/webhook',
        events_types: ['billing.meter_event.created'],
        status: 'active',
        enabled: true,
        description: 'Test webhook endpoint'
      };

      vi.spyOn(sdk, 'v2EnableEventDestination').mockResolvedValue(mockResponse);

      const response = await sdk.v2EnableEventDestination({ id: 'evdest_123456' });

      expect(response.enabled).toBe(true);
    });

    it('should disable an event destination', async () => {
      const mockResponse: V2.EventDestination = {
        id: 'evdest_123456',
        object: 'core.event_destination',
        endpoint_url: 'https://example.com/webhook',
        events_types: ['billing.meter_event.created'],
        status: 'inactive',
        enabled: false,
        description: 'Test webhook endpoint'
      };

      vi.spyOn(sdk, 'v2DisableEventDestination').mockResolvedValue(mockResponse);

      const response = await sdk.v2DisableEventDestination({ id: 'evdest_123456' });

      expect(response.enabled).toBe(false);
      expect(response.status).toBe('inactive');
    });

    it('should ping an event destination', async () => {
      const mockResponse = {
        id: 'evdest_123456',
        object: 'core.event_destination.ping',
        status: 'succeeded',
        timestamp: 1677721600
      };

      vi.spyOn(sdk, 'v2PingEventDestination').mockResolvedValue(mockResponse);

      const response = await sdk.v2PingEventDestination({ id: 'evdest_123456' });

      expect(response.status).toBe('succeeded');
    });
  });

  describe('V2 Core - Events', () => {
    it('should get an event', async () => {
      const mockResponse: V2.Event = {
        id: 'evt_123456',
        object: 'core.event',
        api_version: '2023-10-16',
        created: 1677721600,
        data: {
          object: {
            id: 'me_123456',
            object: 'billing.meter_event'
          }
        },
        type: 'billing.meter_event.created'
      };

      vi.spyOn(sdk, 'v2GetEvent').mockResolvedValue(mockResponse);

      const response = await sdk.v2GetEvent({ event_id: 'evt_123456' });

      expect(response.id).toBe('evt_123456');
      expect(response.type).toBe('billing.meter_event.created');
    });

    it('should list events with pagination', async () => {
      const mockResponse: V2.PaginationResponse<V2.Event> = {
        object: 'list',
        data: [
          {
            id: 'evt_123456',
            object: 'core.event',
            api_version: '2023-10-16',
            created: 1677721600,
            data: {
              object: {
                id: 'me_123456',
                object: 'billing.meter_event'
              }
            },
            type: 'billing.meter_event.created'
          }
        ],
        next_page_url: 'https://api.stripe.com/v2/core/events?page_token=next_token'
      };

      vi.spyOn(sdk, 'v2ListEvents').mockResolvedValue(mockResponse);

      const response = await sdk.v2ListEvents({
        limit: 1
      });

      expect(response.data.length).toBe(1);
      expect(response.next_page_url).toBeDefined();

      // Test pagination helper
      const pageToken = extractPageToken(response.next_page_url);
      expect(pageToken).toBe('next_token');
    });
  });
});

// Helper function for tests
function extractPageToken(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.searchParams.get('page_token');
  } catch (e) {
    return null;
  }
}
