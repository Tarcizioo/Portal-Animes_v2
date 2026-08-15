import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/services/firebase';

const ONBOARDING_VERSION = 2;
const ONBOARDING_STEPS = new Set(['identity', 'privacy', 'favorite', 'complete']);
const ABOUT_MAX_LENGTH = 500;

function assertUserId(uid) {
  if (typeof uid !== 'string' || !uid.trim()) {
    throw new TypeError('Um usuário autenticado é necessário para salvar o onboarding.');
  }
}

function normalizeStep(step) {
  if (!ONBOARDING_STEPS.has(step)) {
    throw new TypeError(`Etapa de onboarding inválida: ${String(step)}`);
  }

  return step;
}

function normalizeProfileFields(profile = {}) {
  const normalized = {};

  if (profile.displayName !== undefined) {
    const displayName = String(profile.displayName).trim();
    normalized.displayName = displayName;
    normalized.searchName = displayName.toLocaleLowerCase('pt-BR');
  }

  if (profile.about !== undefined) {
    normalized.about = String(profile.about).trim().slice(0, ABOUT_MAX_LENGTH);
  }

  if (profile.isPublic !== undefined) {
    if (typeof profile.isPublic !== 'boolean') {
      throw new TypeError('A privacidade do perfil precisa ser um booleano.');
    }
    normalized.isPublic = profile.isPublic;
  }

  return normalized;
}

function getFavoriteId(anime) {
  const rawId = anime?.mal_id ?? anime?.id;
  if (rawId === undefined || rawId === null || String(rawId).trim() === '') {
    throw new TypeError('O anime favorito precisa ter um identificador válido.');
  }

  return String(rawId);
}

function getFavoriteCover(anime) {
  return anime?.images?.webp?.large_image_url
    || anime?.images?.jpg?.large_image_url
    || anime?.coverImage?.extraLarge
    || anime?.coverImage?.large
    || anime?.images?.webp?.image_url
    || anime?.images?.jpg?.image_url
    || anime?.coverImage?.medium
    || anime?.image
    || null;
}

function normalizeList(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => (
    typeof value === 'string' ? value : value?.name
  )).filter(Boolean))];
}

function buildFavoriteData(anime, timestamp, isNewLibraryItem) {
  const id = getFavoriteId(anime);
  const studios = normalizeList(anime.studios);

  return {
    id,
    title: anime.title_english || anime.title || anime.name || 'Anime sem título',
    image: getFavoriteCover(anime),
    totalEp: Number(anime.episodes) || 0,
    genres: normalizeList(anime.genres),
    year: anime.year || anime.aired?.prop?.from?.year || null,
    season: anime.season || null,
    type: anime.type || 'TV',
    synopsis: anime.synopsis || '',
    studios,
    members: Number(anime.members) || 0,
    isFavorite: true,
    lastUpdated: timestamp,
    ...(isNewLibraryItem ? {
      currentEp: 0,
      score: 0,
      status: 'plan_to_watch',
    } : {}),
  };
}

function buildProgressData(profile, step, timestamp) {
  return {
    ...normalizeProfileFields(profile),
    onboardingVersion: ONBOARDING_VERSION,
    onboardingStep: normalizeStep(step),
    onboardingUpdatedAt: timestamp,
  };
}

export async function saveOnboardingProgress({
  uid,
  step = 'identity',
  displayName,
  about,
  isPublic,
} = {}) {
  assertUserId(uid);

  const timestamp = serverTimestamp();
  const batch = writeBatch(db);
  const userRef = doc(db, 'users', uid);
  const profile = { displayName, about, isPublic };

  batch.set(userRef, buildProgressData(profile, step, timestamp), { merge: true });
  await batch.commit();
}

export async function completeOnboarding({
  uid,
  displayName,
  about,
  isPublic,
  favoriteAnime = null,
} = {}) {
  assertUserId(uid);

  const favoriteId = favoriteAnime ? getFavoriteId(favoriteAnime) : null;
  const favoriteRef = favoriteId ? doc(db, 'users', uid, 'library', favoriteId) : null;
  const favoriteSnapshot = favoriteRef ? await getDoc(favoriteRef) : null;
  const timestamp = serverTimestamp();
  const batch = writeBatch(db);
  const userRef = doc(db, 'users', uid);
  const profile = { displayName, about, isPublic };
  const profileData = {
    ...buildProgressData(profile, 'complete', timestamp),
    hasCompletedOnboarding: true,
    onboardingCompletedAt: timestamp,
  };

  batch.set(userRef, profileData, { merge: true });

  if (favoriteAnime) {
    batch.set(
      favoriteRef,
      buildFavoriteData(favoriteAnime, timestamp, !favoriteSnapshot.exists()),
      { merge: true },
    );
  }

  await batch.commit();
}
