import { useQuery } from '@tanstack/react-query';
import { anilistApi } from '@/services/anilistApi';

const STALE_TIME = 1000 * 60 * 60;

function formatAnime(data) {
  return {
    id: data.mal_id,
    title: data.title_english || data.title,
    title_english: data.title_english,
    title_jp: data.title_japanese,
    images: data.images,
    image: data.images?.webp?.large_image_url || data.images?.jpg?.large_image_url || data.images?.jpg?.image_url,
    banner: data.banner_image || data.trailer?.images?.maximum_image_url || data.images?.webp?.large_image_url || data.images?.jpg?.large_image_url,
    trailer: data.trailer?.embed_url,
    synopsis: data.synopsis,
    year: data.year || data.aired?.prop?.from?.year || '?',
    score: data.score,
    episodes: data.episodes || '?',
    duration: data.duration || '24 min',
    rating: data.rating,
    status: data.status,
    studios: data.studios,
    genres: data.genres,
    themes: data.themes,
    demographics: data.demographics,
    rank: data.rank,
    popularity: data.popularity,
    season: data.season,
    source: data.source,
    type: data.type,
    members: data.members,
    aired: data.aired,
    relations: data.relations || [],
  };
}

async function fetchAnime(id, signal) {
  const response = await anilistApi.getAnimeByMalId(id, { signal });
  if (!response?.data) throw new Error('Anime nao pode ser carregado agora.');

  return {
    anime: formatAnime(response.data),
    characters: response.characters || [],
    recommendations: response.recommendations || [],
    episodesList: [],
    staff: response.staff || [],
  };
}

export function useAnimeInfo(id) {
  const enabled = Boolean(id && id !== 'undefined');
  const query = useQuery({
    queryKey: ['anime-core', 'anilist-v4', id],
    queryFn: ({ signal }) => fetchAnime(id, signal),
    staleTime: STALE_TIME,
    enabled,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 3000),
  });

  const anime = query.data?.anime
    ? { ...query.data.anime, episodesList: query.data.episodesList || [] }
    : null;

  return {
    anime,
    characters: query.data?.characters || [],
    recommendations: query.data?.recommendations || [],
    staff: query.data?.staff || [],
    loading: query.isLoading,
    extrasLoading: false,
    error: query.error,
  };
}