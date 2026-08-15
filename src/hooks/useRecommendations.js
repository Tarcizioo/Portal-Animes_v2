import { useQuery } from '@tanstack/react-query';
import { anilistApi } from '@/services/anilistApi';

function pickSeeds(library, count = 3) {
    if (!library || library.length === 0) return [];

    const sorted = [...library].sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);

        const statusOrder = { watching: 0, completed: 1, plan_to_watch: 2, paused: 3, dropped: 4 };
        return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
    });

    return sorted.slice(0, count);
}

async function fetchRecommendations(seedIds, libraryIds, signal) {
    const seenIds = new Set(libraryIds);
    const response = await anilistApi.getRecommendations(seedIds, 10, { signal });

    return (response.data || [])
        .filter((recommendation) => {
            const entryId = String(recommendation.entry?.mal_id || '');
            if (!entryId || seenIds.has(entryId)) return false;
            seenIds.add(entryId);
            return true;
        })
        .map((recommendation) => {
            const entry = recommendation.entry;
            return {
                id: entry.mal_id,
                title: entry.title_english || entry.title,
                image: entry.images?.webp?.large_image_url || entry.images?.jpg?.large_image_url,
                images: entry.images,
                episodes: entry.episodes || null,
                score: entry.score,
                votes: recommendation.votes || 0,
            };
        })
        .slice(0, 8);
}

export function useRecommendations(library, { enabled = true } = {}) {
    const seeds = pickSeeds(library);
    const seedIds = seeds.map((seed) => seed.id);
    const libraryIds = new Set((library || []).map((anime) => String(anime.id)));
    const libraryFingerprint = [...libraryIds].sort().join(',');

    return useQuery({
        queryKey: ['recommendations', 'anilist-v1', seedIds, libraryFingerprint],
        queryFn: ({ signal }) => fetchRecommendations(seedIds, libraryIds, signal),
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 2,
        enabled: enabled && seedIds.length > 0,
        retry: 1,
    });
}
