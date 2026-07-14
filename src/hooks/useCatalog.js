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

function getUrlFilters(searchParams) {
  const genreParam = searchParams.get('genre');
  const qParam = searchParams.get('q');

  if (qParam) {
    return {
      ...DEFAULT_FILTERS,
      q: qParam,
    };
  }

  if (genreParam) {
    const genreId = Number.parseInt(genreParam, 10);
    if (!Number.isNaN(genreId)) {
      return {
        ...DEFAULT_FILTERS,
        genres: [genreId],
      };
    }
  }

  return null;
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
