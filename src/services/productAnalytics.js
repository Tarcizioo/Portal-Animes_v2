import { createFirebaseAnalyticsAdapter, isProductAnalyticsConfigured } from '@/services/firebaseAnalyticsAdapter';
import { normalizeProductEvent } from '@/services/productEvents';

export { PRODUCT_EVENTS } from '@/services/productEvents';

export function createProductAnalytics({ enabled = false, createAdapter } = {}) {
  let adapterPromise = null;

  const getAdapter = () => {
    if (!adapterPromise) {
      adapterPromise = Promise.resolve()
        .then(() => createAdapter?.())
        .catch(() => null);
    }

    return adapterPromise;
  };

  return Object.freeze({
    enabled: Boolean(enabled),
    async track(eventName, rawParameters = {}) {
      const event = normalizeProductEvent(eventName, rawParameters);
      if (!enabled || !event) return false;

      try {
        const adapter = await getAdapter();
        if (!adapter?.track) return false;

        await adapter.track(event.name, event.parameters);
        return true;
      } catch {
        return false;
      }
    },
  });
}

const environment = import.meta.env;
const analyticsEnabled = isProductAnalyticsConfigured(environment);

export const productAnalytics = createProductAnalytics({
  enabled: analyticsEnabled,
  createAdapter: () => createFirebaseAnalyticsAdapter({
    enabled: analyticsEnabled,
    measurementId: environment.VITE_FIREBASE_MEASUREMENT_ID,
  }),
});

export function trackProductEvent(eventName, parameters) {
  return productAnalytics.track(eventName, parameters);
}
