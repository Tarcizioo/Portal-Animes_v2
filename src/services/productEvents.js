export const PRODUCT_EVENTS = Object.freeze({
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ANIME_OPENED: 'anime_opened',
  LIBRARY_UPDATED: 'library_updated',
  PROGRESS_UPDATED: 'progress_updated',
});

const AUTH_METHODS = ['email', 'google'];
const IMPORT_SOURCES = ['mal', 'portal_json', 'none'];
const LIBRARY_ACTIONS = ['add', 'remove', 'status_change', 'favorite_change', 'import', 'sync'];
const LIBRARY_STATUSES = ['watching', 'completed', 'plan_to_watch', 'paused', 'dropped'];
const EVENT_SOURCES = [
  'home',
  'catalog',
  'search',
  'calendar',
  'recommendation',
  'library',
  'profile',
  'anime_details',
  'character_details',
  'onboarding',
  'import',
  'direct',
  'unknown',
];

function enumValue(values) {
  const allowedValues = new Set(values);
  return (value) => (allowedValues.has(value) ? value : undefined);
}

function booleanValue(value) {
  return typeof value === 'boolean' ? value : undefined;
}

function integerValue({ min = 0, max = 1_000_000 } = {}) {
  return (value) => {
    if (value === '' || value === null || value === undefined || typeof value === 'boolean') return undefined;

    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < min || number > max) return undefined;
    return number;
  };
}

const animeId = integerValue({ min: 1, max: Number.MAX_SAFE_INTEGER });
const count = integerValue();

export const PRODUCT_EVENT_SCHEMAS = Object.freeze({
  [PRODUCT_EVENTS.SIGN_UP]: {
    required: ['method'],
    parameters: {
      method: enumValue(AUTH_METHODS),
    },
  },
  [PRODUCT_EVENTS.LOGIN]: {
    required: ['method'],
    parameters: {
      method: enumValue(AUTH_METHODS),
    },
  },
  [PRODUCT_EVENTS.ONBOARDING_COMPLETED]: {
    required: [],
    parameters: {
      favorite_selected: booleanValue,
      library_imported: booleanValue,
      import_source: enumValue(IMPORT_SOURCES),
      imported_item_count: count,
    },
  },
  [PRODUCT_EVENTS.ANIME_OPENED]: {
    required: ['anime_id'],
    parameters: {
      anime_id: animeId,
      source: enumValue(EVENT_SOURCES),
    },
  },
  [PRODUCT_EVENTS.LIBRARY_UPDATED]: {
    required: ['action'],
    parameters: {
      action: enumValue(LIBRARY_ACTIONS),
      anime_id: animeId,
      status: enumValue(LIBRARY_STATUSES),
      item_count: count,
      source: enumValue(EVENT_SOURCES),
    },
  },
  [PRODUCT_EVENTS.PROGRESS_UPDATED]: {
    required: ['anime_id', 'episode'],
    parameters: {
      anime_id: animeId,
      episode: count,
      previous_episode: count,
      total_episodes: count,
      source: enumValue(EVENT_SOURCES),
    },
  },
});

export function isAllowedProductEvent(eventName) {
  return Object.hasOwn(PRODUCT_EVENT_SCHEMAS, eventName);
}

export function normalizeProductEvent(eventName, rawParameters = {}) {
  const schema = PRODUCT_EVENT_SCHEMAS[eventName];
  if (!schema) return null;

  const parameters = rawParameters && typeof rawParameters === 'object' && !Array.isArray(rawParameters)
    ? rawParameters
    : {};
  const safeParameters = {};

  Object.entries(schema.parameters).forEach(([parameterName, normalize]) => {
    const normalizedValue = normalize(parameters[parameterName]);
    if (normalizedValue !== undefined) safeParameters[parameterName] = normalizedValue;
  });

  const isValid = schema.required.every((parameterName) => (
    Object.hasOwn(safeParameters, parameterName)
  ));

  if (!isValid) return null;
  return { name: eventName, parameters: safeParameters };
}
