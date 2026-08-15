import { useMemo } from 'react';
import { useHomeContent } from '@/hooks/useAnimeDiscovery';
import { useCalendar } from '@/hooks/useCalendar';

export const DISCOVER_GENRES = [
  { id: 'action', title: 'Ação e Adrenalina', genreId: 1, genreName: 'Action' },
  { id: 'romance', title: 'Romance e Amor', genreId: 22, genreName: 'Romance' },
  { id: 'drama', title: 'Drama e Emoção', genreId: 8, genreName: 'Drama' },
  { id: 'horror', title: 'Terror e Suspense', genreId: 14, genreName: 'Horror' },
  { id: 'comedy', title: 'Comédia e Diversão', genreId: 4, genreName: 'Comedy' },
  { id: 'fantasy', title: 'Mundo da Fantasia', genreId: 10, genreName: 'Fantasy' },
  { id: 'scifi', title: 'Ficção Científica', genreId: 24, genreName: 'Sci-Fi' },
  { id: 'sports', title: 'Esportes & Competição', genreId: 30, genreName: 'Sports' },
];

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const EMPTY_ANIMES = [];
const EMPTY_GENRE_ROWS = {};

function getAnimeId(anime) {
  return anime?.id ?? anime?.mal_id ?? null;
}

export function dedupeDiscoverAnimes(animes = [], excludedIds = []) {
  const excluded = new Set(excludedIds.filter(Boolean).map(String));
  const unique = new Map();

  animes.forEach((anime) => {
    const id = getAnimeId(anime);
    if (!id || excluded.has(String(id)) || unique.has(String(id))) return;
    unique.set(String(id), anime);
  });

  return [...unique.values()];
}

export function getCurrentCatalogSeason(date = new Date()) {
  const month = date.getMonth();
  if (month <= 2) return 'winter';
  if (month <= 5) return 'spring';
  if (month <= 8) return 'summer';
  return 'fall';
}

function matchesGenre(anime, category) {
  const genreIds = Array.isArray(anime?.genreIds) ? anime.genreIds : [];
  const genres = Array.isArray(anime?.genres)
    ? anime.genres.map((genre) => (typeof genre === 'string' ? genre : genre?.name)).filter(Boolean)
    : [];

  return genreIds.includes(category.genreId) || genres.includes(category.genreName);
}

export function buildDiscoverGenreRows(popularAnimes = [], seasonalAnimes = [], directRows = {}) {
  const pool = dedupeDiscoverAnimes([...seasonalAnimes, ...popularAnimes]);

  return DISCOVER_GENRES.map((category) => {
    const direct = directRows[category.id] || [];
    const matches = pool.filter((anime) => matchesGenre(anime, category));

    return {
      ...category,
      animes: dedupeDiscoverAnimes([...direct, ...matches]).slice(0, 18),
    };
  });
}

function normalizeScheduleAnime(anime) {
  const id = getAnimeId(anime);
  const genres = Array.isArray(anime?.genres)
    ? anime.genres.map((genre) => (typeof genre === 'string' ? genre : genre?.name)).filter(Boolean)
    : [];

  return {
    ...anime,
    id,
    title: anime?.title_english || anime?.title || 'Anime sem título',
    image: anime?.image
      || anime?.images?.webp?.large_image_url
      || anime?.images?.jpg?.large_image_url
      || anime?.images?.webp?.image_url
      || anime?.images?.jpg?.image_url,
    smallImage: anime?.smallImage
      || anime?.images?.webp?.small_image_url
      || anime?.images?.jpg?.small_image_url
      || anime?.images?.webp?.image_url
      || anime?.images?.jpg?.image_url,
    genres,
    episode: anime?.airing?.episode || null,
  };
}

export function useDiscoverContent() {
  const {
    popularAnimes: homePopularAnimes = EMPTY_ANIMES,
    seasonalAnimes: homeSeasonalAnimes = EMPTY_ANIMES,
    genreRows: homeGenreRows = EMPTY_GENRE_ROWS,
    loading: discoveryLoading,
    error: discoveryError,
    isRefreshing: discoveryRefreshing,
    refetch: retryDiscovery,
  } = useHomeContent();
  const today = DAYS[new Date().getDay()] || 'monday';
  const {
    animes: calendarAnimes = EMPTY_ANIMES,
    loading: releasesLoading,
    error: releasesError,
    refetch: retryReleases,
  } = useCalendar(today);

  const content = useMemo(() => {
    const seasonalAnimes = dedupeDiscoverAnimes(homeSeasonalAnimes);
    const popularAnimes = dedupeDiscoverAnimes(homePopularAnimes);
    const seasonHighlight = seasonalAnimes[0] || popularAnimes[0] || null;
    const newSeasonalAnimes = dedupeDiscoverAnimes(
      seasonalAnimes,
      seasonHighlight ? [getAnimeId(seasonHighlight)] : [],
    ).slice(0, 18);
    const todayReleases = dedupeDiscoverAnimes(
      calendarAnimes.map(normalizeScheduleAnime),
    ).slice(0, 3);

    return {
      season: getCurrentCatalogSeason(),
      year: new Date().getFullYear(),
      seasonHighlight,
      newSeasonalAnimes,
      popularAnimes,
      todayReleases,
      genreRows: buildDiscoverGenreRows(popularAnimes, seasonalAnimes, homeGenreRows),
    };
  }, [calendarAnimes, homeGenreRows, homePopularAnimes, homeSeasonalAnimes]);

  return {
    ...content,
    discoveryLoading,
    discoveryError,
    discoveryRefreshing,
    retryDiscovery,
    releasesLoading,
    releasesError,
    retryReleases,
  };
}
