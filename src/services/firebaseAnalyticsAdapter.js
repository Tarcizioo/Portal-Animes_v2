export function isProductAnalyticsConfigured(environment = {}) {
  const measurementId = environment.VITE_FIREBASE_MEASUREMENT_ID;

  return environment.MODE !== 'test'
    && environment.VITE_ENABLE_PRODUCT_ANALYTICS === 'true'
    && typeof measurementId === 'string'
    && measurementId.trim().length > 0;
}

async function loadFirebaseAnalyticsSdk() {
  return import('firebase/analytics');
}

async function loadFirebaseApp() {
  return import('@/services/firebase');
}

export async function createFirebaseAnalyticsAdapter({
  enabled = false,
  measurementId = '',
  browserAvailable = typeof window !== 'undefined',
  loadAnalyticsSdk = loadFirebaseAnalyticsSdk,
  loadApp = loadFirebaseApp,
} = {}) {
  if (!enabled || !browserAvailable || typeof measurementId !== 'string' || !measurementId.trim()) {
    return null;
  }

  const analyticsSdk = await loadAnalyticsSdk();
  if (!await analyticsSdk.isSupported()) return null;

  const firebaseModule = await loadApp();
  const analytics = analyticsSdk.getAnalytics(firebaseModule.default);

  return {
    track(eventName, parameters) {
      analyticsSdk.logEvent(analytics, eventName, parameters);
    },
  };
}
