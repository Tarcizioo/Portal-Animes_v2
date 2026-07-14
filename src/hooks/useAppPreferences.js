import { useCallback, useEffect, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'portal_animes_preferences';
const CHANGE_EVENT = 'portal-animes:preferences-changed';

export const DEFAULT_APP_PREFERENCES = Object.freeze({
  autoPlayHero: true,
  reducedMotion: false,
  carouselDensity: 'comfortable',
  showScores: true,
  hideReadNotifications: false,
});

let cachedRaw = null;
let cachedPreferences = DEFAULT_APP_PREFERENCES;

function readPreferences() {
  if (typeof window === 'undefined') return DEFAULT_APP_PREFERENCES;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedPreferences;

  cachedRaw = raw;
  try {
    const saved = raw ? JSON.parse(raw) : {};
    cachedPreferences = { ...DEFAULT_APP_PREFERENCES, ...saved };
  } catch {
    cachedPreferences = DEFAULT_APP_PREFERENCES;
  }

  return cachedPreferences;
}

function subscribe(onStoreChange) {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('storage', onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function savePreferences(nextPreferences) {
  const normalized = { ...DEFAULT_APP_PREFERENCES, ...nextPreferences };
  const raw = JSON.stringify(normalized);

  cachedRaw = raw;
  cachedPreferences = normalized;
  window.localStorage.setItem(STORAGE_KEY, raw);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function useAppPreferences() {
  const preferences = useSyncExternalStore(subscribe, readPreferences, () => DEFAULT_APP_PREFERENCES);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(preferences.reducedMotion);
  }, [preferences.reducedMotion]);

  const updatePreference = useCallback((key, value) => {
    savePreferences({ ...readPreferences(), [key]: value });
  }, []);

  const resetPreferences = useCallback(() => {
    savePreferences(DEFAULT_APP_PREFERENCES);
  }, []);

  return { preferences, updatePreference, resetPreferences };
}
