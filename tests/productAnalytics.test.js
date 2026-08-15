import { describe, expect, it, vi } from 'vitest';
import {
  createFirebaseAnalyticsAdapter,
  isProductAnalyticsConfigured,
} from '@/services/firebaseAnalyticsAdapter';
import { createProductAnalytics, PRODUCT_EVENTS } from '@/services/productAnalytics';
import { normalizeProductEvent } from '@/services/productEvents';

describe('product event schema', () => {
  it('keeps only allowlisted, non-PII parameters', () => {
    expect(normalizeProductEvent(PRODUCT_EVENTS.ANIME_OPENED, {
      anime_id: '5114',
      source: 'search',
      email: 'user@example.com',
      title: 'Fullmetal Alchemist',
      arbitrary: 'value',
    })).toEqual({
      name: PRODUCT_EVENTS.ANIME_OPENED,
      parameters: {
        anime_id: 5114,
        source: 'search',
      },
    });
  });

  it('rejects unknown events and events missing required parameters', () => {
    expect(normalizeProductEvent('email_submitted', { email: 'user@example.com' })).toBeNull();
    expect(normalizeProductEvent(PRODUCT_EVENTS.LOGIN, { method: 'password-reset' })).toBeNull();
    expect(normalizeProductEvent(PRODUCT_EVENTS.PROGRESS_UPDATED, { anime_id: 1 })).toBeNull();
  });

  it('normalizes the minimum library and progress payloads', () => {
    expect(normalizeProductEvent(PRODUCT_EVENTS.LIBRARY_UPDATED, {
      action: 'status_change',
      anime_id: 21,
      status: 'watching',
      source: 'anime_details',
    })?.parameters).toEqual({
      action: 'status_change',
      anime_id: 21,
      status: 'watching',
      source: 'anime_details',
    });

    expect(normalizeProductEvent(PRODUCT_EVENTS.PROGRESS_UPDATED, {
      anime_id: '21',
      episode: '4',
      previous_episode: 3,
      total_episodes: 12,
      source: 'library',
    })?.parameters).toEqual({
      anime_id: 21,
      episode: 4,
      previous_episode: 3,
      total_episodes: 12,
      source: 'library',
    });
  });
});

describe('product analytics client', () => {
  it('is a no-op when disabled and does not initialize the adapter', async () => {
    const createAdapter = vi.fn();
    const analytics = createProductAnalytics({ enabled: false, createAdapter });

    await expect(analytics.track(PRODUCT_EVENTS.LOGIN, { method: 'google' })).resolves.toBe(false);
    expect(createAdapter).not.toHaveBeenCalled();
  });

  it('sends sanitized events through a vendor-neutral adapter', async () => {
    const track = vi.fn();
    const analytics = createProductAnalytics({
      enabled: true,
      createAdapter: vi.fn().mockResolvedValue({ track }),
    });

    await expect(analytics.track(PRODUCT_EVENTS.SIGN_UP, {
      method: 'email',
      email: 'must-not-leave-the-app@example.com',
    })).resolves.toBe(true);

    expect(track).toHaveBeenCalledWith(PRODUCT_EVENTS.SIGN_UP, { method: 'email' });
  });

  it('never lets adapter failures break a product flow', async () => {
    const analytics = createProductAnalytics({
      enabled: true,
      createAdapter: vi.fn().mockRejectedValue(new Error('analytics unavailable')),
    });

    await expect(analytics.track(PRODUCT_EVENTS.LOGIN, { method: 'email' })).resolves.toBe(false);
  });
});

describe('Firebase Analytics adapter', () => {
  it('requires explicit configuration and always stays disabled in tests', () => {
    expect(isProductAnalyticsConfigured({
      MODE: 'production',
      VITE_ENABLE_PRODUCT_ANALYTICS: 'true',
      VITE_FIREBASE_MEASUREMENT_ID: 'G-123',
    })).toBe(true);

    expect(isProductAnalyticsConfigured({
      MODE: 'development',
      VITE_FIREBASE_MEASUREMENT_ID: 'G-123',
    })).toBe(false);

    expect(isProductAnalyticsConfigured({
      MODE: 'test',
      VITE_ENABLE_PRODUCT_ANALYTICS: 'true',
      VITE_FIREBASE_MEASUREMENT_ID: 'G-123',
    })).toBe(false);
  });

  it('does not load Firebase when disabled or unsupported', async () => {
    const loadAnalyticsSdk = vi.fn();

    await expect(createFirebaseAnalyticsAdapter({
      enabled: false,
      measurementId: 'G-123',
      loadAnalyticsSdk,
    })).resolves.toBeNull();
    expect(loadAnalyticsSdk).not.toHaveBeenCalled();

    const isSupported = vi.fn().mockResolvedValue(false);
    const loadApp = vi.fn();
    await expect(createFirebaseAnalyticsAdapter({
      enabled: true,
      measurementId: 'G-123',
      loadAnalyticsSdk: vi.fn().mockResolvedValue({ isSupported }),
      loadApp,
    })).resolves.toBeNull();
    expect(loadApp).not.toHaveBeenCalled();
  });

  it('forwards supported events to Firebase Analytics', async () => {
    const analyticsInstance = {};
    const firebaseApp = {};
    const logEvent = vi.fn();
    const getAnalytics = vi.fn().mockReturnValue(analyticsInstance);
    const adapter = await createFirebaseAnalyticsAdapter({
      enabled: true,
      measurementId: 'G-123',
      loadAnalyticsSdk: vi.fn().mockResolvedValue({
        isSupported: vi.fn().mockResolvedValue(true),
        getAnalytics,
        logEvent,
      }),
      loadApp: vi.fn().mockResolvedValue({ default: firebaseApp }),
    });

    adapter.track(PRODUCT_EVENTS.LOGIN, { method: 'google' });

    expect(getAnalytics).toHaveBeenCalledWith(firebaseApp);
    expect(logEvent).toHaveBeenCalledWith(analyticsInstance, PRODUCT_EVENTS.LOGIN, { method: 'google' });
  });
});
