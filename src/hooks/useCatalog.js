import { startTransition, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { anilistApi } from '@/services/anilistApi';

const PAGE_SIZE = 24;

const DEFAULT_FILTERS = {
  q: '',
  genres: [],
  orderBy: 'ranking',
  status: '',
  year: '',
  season: '',
  type: '',
  producers: '',
};

const URL_FILTER_VALUES = {
  orderBy: new Set(['ranking', 'score', 'popularity', 'favorites', 'newest', 'oldest', 'az', 'za']),
  season: new Set(['winter', 'spring', 'summer', 'fall']),
  status: new Set(['airing', 'complete', 'upcoming']),
  type: new Set(['tv', 'movie', 'ova', 'special', 'ona', 'music']),
};

function getValidUrlValue(searchParams, key, allowedValues) {
  const value = searchParams.get(key)?.trim().toLowerCase();
  return value && allowedValues.has(value) ? value : '';
}

export function getUrlFilters(searchParams) {
  const filters = { ...DEFAULT_FILTERS };
  let hasUrlFilter = false;

  const query = searchParams.get('q')?.trim();
  if (query) {
    filters.q = query;
    hasUrlFilter = true;
  }

  const genreParams = [
    ...searchParams.getAll('genre'),
    ...(searchParams.get('genres')?.split(',') || []),
  ];
  const genres = [...new Set(
    genreParams
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isInteger(value) && value > 0),
  )];
  if (genres.length > 0) {
    filters.genres = genres;
    hasUrlFilter = true;
  }

  ['orderBy', 'season', 'status'].forEach((key) => {
    const value = getValidUrlValue(searchParams, key, URL_FILTER_VALUES[key]);
    if (!value) return;
    filters[key] = value;
    hasUrlFilter = true;
  });

  const type = getValidUrlValue(searchParams, 'type', URL_FILTER_VALUES.type)
    || getValidUrlValue(searchParams, 'format', URL_FILTER_VALUES.type);
  if (type) {
    filters.type = type;
    hasUrlFilter = true;
  }

  const year = Number.parseInt(searchParams.get('year'), 10);
  if (Number.isInteger(year) && year > 1900 && year <= 2200) {
    filters.year = String(year);
    hasUrlFilter = true;
  }

  const producers = searchParams.get('producers')?.trim();
  if (producers) {
    filters.producers = producers;
    hasUrlFilter = true;
  }

  return hasUrlFilter ? filters : null;
}

function getInitialFilters(searchParams) {
  const urlFilters = getUrlFilters(searchParams);
  if (urlFilters) return urlFilters;

  const saved = localStorage.getItem('anime_catalog_filters');
  if (saved) {
    try {
      return { ...DEFAULT_FILTERS, ...JSON.parse(saved) };
    } catch (error) {
      console.error('Erro ao ler filtros do catÃ¡logo', error);
    }
  }

  return DEFAULT_FILTERS;
}

function transformAnime(anime) {
  return {
    id: anime.mal_id,
    title: anime.title_english || anime.title,
    image: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url || anime.images?.webp?.image_url || anime.images?.jpg?.image_url,
    smallImage: anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url || anime.images?.webp?.image_url || anime.images?.jpg?.image_url,
    images: anime.images,
    score: anime.score || 'N/A',
    genres: anime.genres ? anime.genres.map((genre) => genre.name).slice(0, 2).join(', ') : '',
    synopsis: anime.synopsis,
    status: anime.status,
    members: anime.members,
    year: anime.year || anime.aired?.prop?.from?.year,
    episodes: anime.episodes,
    type: anime.type,
  };
}

async function fetchCatalogPage({ pageParam, filters, signal }) {
  const response = await anilistApi.getCatalog(filters, pageParam, PAGE_SIZE, { signal });
  const data = response.data || [];

  return {
    items: data.map(transformAnime),
    hasNextPage: Boolean(response.pagination?.has_next_page),
  };
}

export function useCatalog() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => getInitialFilters(searchParams));
  const [debouncedQ, setDebouncedQ] = useState(filters.q);
  const urlFilters = useMemo(() => getUrlFilters(searchParams), [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(filters.q.trim()), 400);
    return () => clearTimeout(timer);
  }, [filters.q]);

  useEffect(() => {
    localStorage.setItem('anime_catalog_filters', JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    if (!urlFilters) return;

    startTransition(() => {
      setFilters((current) => {
        const isSame = JSON.stringify(current) === JSON.stringify(urlFilters);
        return isSame ? current : urlFilters;
      });
    });
  }, [urlFilters]);

  const queryFilters = useMemo(
    () => ({ ...filters, q: debouncedQ }),
    [filters, debouncedQ],
  );

  const catalogQuery = useInfiniteQuery({
    queryKey: ['catalog', 'anilist-v1', queryFilters],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchCatalogPage({ pageParam, filters: queryFilters, signal }),
    getNextPageParam: (lastPage, allPages) => (lastPage.hasNextPage ? allPages.length + 1 : undefined),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 3000),
  });

  const animes = useMemo(() => {
    const pages = catalogQuery.data?.pages || [];
    const combined = pages.flatMap((page) => page.items);
    return Array.from(new Map(combined.map((item) => [item.id, item])).values());
  }, [catalogQuery.data]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const loadMore = () => {
    if (!catalogQuery.hasNextPage || catalogQuery.isFetchingNextPage) return;
    catalogQuery.fetchNextPage();
  };

  return {
    animes,
    loading: catalogQuery.isPending || catalogQuery.isFetchingNextPage,
    error: catalogQuery.error,
    retry: catalogQuery.refetch,
    isRetrying: catalogQuery.isFetching && !catalogQuery.isFetchingNextPage,
    isSearchPending: filters.q.trim() !== debouncedQ,
    loadMore,
    hasMore: Boolean(catalogQuery.hasNextPage),
    filters,
    updateFilter,
    clearFilters,
  };
}
