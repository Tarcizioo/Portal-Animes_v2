import { useQuery } from '@tanstack/react-query';
import { anilistApi } from '@/services/anilistApi';

const STALE_TIME_24H = 1000 * 60 * 60 * 24;
const currentYear = new Date().getFullYear();

const transformData = (anime) => {
    const genres = (anime.genres || [])
        .map((genre) => (typeof genre === 'string' ? genre : genre.name))
        .filter(Boolean);

    return {
        id: anime.mal_id,
        title: anime.title_english || anime.title,
        image: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        smallImage: anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url || anime.images?.webp?.image_url || anime.images?.jpg?.image_url,
        images: anime.images,
        banner: anime.banner || null,
        year: anime.year || anime.aired?.prop?.from?.year || currentYear,
        episodes: anime.episodes || null,
        score: anime.score ?? 'N/A',
        isNew: anime.airing || anime.status === 'Currently Airing' || anime.year >= currentYear - 1,
        genres: genres.slice(0, 3),
        genreIds: (anime.genres || []).map((genre) => genre?.mal_id).filter(Boolean),
        synopsis: anime.synopsis || 'Sinopse indisponivel.',
        trailerUrl: anime.trailer?.url,
    };
};

const removeDuplicates = (list) => {
    const seen = new Set();
    return list.filter((item) => {
        if (!item.id || seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

function getCurrentSeason(date = new Date()) {
    const month = date.getMonth();
    if (month <= 2) return 'WINTER';
    if (month <= 5) return 'SPRING';
    if (month <= 8) return 'SUMMER';
    return 'FALL';
}

function mapAnimeList(list = []) {
    return removeDuplicates(list.map(transformData));
}

function mapAnimePage(json) {
    return mapAnimeList(json.data || []);
}

const fetchPopular = async (signal) => mapAnimePage(await anilistApi.getTopAnime(1, 25, { signal }));

export const popularAnimeQueryOptions = {
    queryKey: ['popular-anime', 'anilist-v4'],
    queryFn: ({ signal }) => fetchPopular(signal),
    staleTime: STALE_TIME_24H,
    gcTime: STALE_TIME_24H,
    retry: 2,
    refetchOnWindowFocus: false,
};

const fetchSeasonal = async (signal) => mapAnimePage(await anilistApi.getSeasonalAnime(
    getCurrentSeason(),
    new Date().getFullYear(),
    1,
    25,
    { signal },
));

const fetchGenreRows = async (signal) => {
    const response = await anilistApi.getHomeGenreRows(18, { signal });
    return Object.fromEntries(
        Object.entries(response.data || {}).map(([key, items]) => [key, mapAnimeList(items)]),
    );
};

function buildFeaturedAnimes(popularAnimes, seasonalAnimes) {
    const featured = [];
    const usedIds = new Set();
    const configs = [
        { index: 0, label: 'Top Ranking', color: 'text-yellow-400', icon: 'Award' },
        { index: 1, label: 'Em Alta', color: 'text-blue-400', icon: 'TrendingUp' },
        { index: 2, label: 'Favorito da Comunidade', color: 'text-red-400', icon: 'Heart' },
    ];

    for (const config of configs) {
        const anime = popularAnimes?.[config.index];
        if (!anime || usedIds.has(anime.id)) continue;

        usedIds.add(anime.id);
        featured.push({
            ...anime,
            uniqueId: `popular-${anime.id}`,
            heroLabel: config.label,
            heroColor: config.color,
            heroIcon: config.icon,
        });
    }

    const seasonalAnime = seasonalAnimes?.find((anime) => !usedIds.has(anime.id));
    if (seasonalAnime) {
        featured.push({
            ...seasonalAnime,
            uniqueId: `seasonal-${seasonalAnime.id}`,
            heroLabel: 'Destaque da Temporada',
            heroColor: 'text-green-400',
            heroIcon: 'Calendar',
        });
    }

    return featured;
}

export function useHomeContent({ includeGenreRows = true } = {}) {
    const popularQuery = useQuery(popularAnimeQueryOptions);

    const seasonalQuery = useQuery({
        queryKey: ['seasonal-anime', 'anilist-v4'],
        queryFn: ({ signal }) => fetchSeasonal(signal),
        staleTime: STALE_TIME_24H,
        gcTime: STALE_TIME_24H,
        retry: 2,
        refetchOnWindowFocus: false,
    });

    const genreRowsQuery = useQuery({
        queryKey: ['home-genre-rows', 'anilist-v1'],
        queryFn: ({ signal }) => fetchGenreRows(signal),
        staleTime: STALE_TIME_24H,
        gcTime: STALE_TIME_24H,
        retry: 2,
        refetchOnWindowFocus: false,
        enabled: includeGenreRows,
    });

    const popularAnimes = popularQuery.data || [];
    const seasonalAnimes = seasonalQuery.data || [];
    const featuredAnimes = buildFeaturedAnimes(popularAnimes, seasonalAnimes);

    return {
        heroAnime: featuredAnimes[0] || null,
        featuredAnimes,
        popularAnimes,
        seasonalAnimes,
        genreRows: genreRowsQuery.data || {},
        loading: popularQuery.isLoading || seasonalQuery.isLoading || (includeGenreRows && genreRowsQuery.isLoading),
        error: popularQuery.error || seasonalQuery.error || (includeGenreRows ? genreRowsQuery.error : null),
        isRefreshing: popularQuery.isFetching || seasonalQuery.isFetching || (includeGenreRows && genreRowsQuery.isFetching),
        refetch: () => Promise.all([
            popularQuery.refetch(),
            seasonalQuery.refetch(),
            ...(includeGenreRows ? [genreRowsQuery.refetch()] : []),
        ]),
    };
}
