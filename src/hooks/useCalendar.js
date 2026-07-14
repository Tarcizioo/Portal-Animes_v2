import { useQuery } from '@tanstack/react-query';
import { anilistApi } from '@/services/anilistApi';

export function dedupeSchedules(animes = []) {
    return Array.from(
        new Map(
            animes
                .filter((anime) => anime?.mal_id)
                .map((anime) => [anime.mal_id, anime])
        ).values()
    );
}

const fetchSchedules = async (day, signal) => {
    const response = await anilistApi.getSchedules(day, { signal });
    return dedupeSchedules(response.data || []);
};

export function useCalendar(selectedDay = 'monday') {
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['schedules', 'anilist-v1', selectedDay],
        queryFn: ({ signal }) => fetchSchedules(selectedDay, signal),
        staleTime: 1000 * 60 * 30,
        retry: 2,
    });

    return {
        animes: data || [],
        loading: isLoading,
        error,
        refetch
    };
}
