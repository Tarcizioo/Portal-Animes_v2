import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { anilistApi } from '@/services/anilistApi';

const STALE_TIME_24H = 1000 * 60 * 60 * 24;

const PERSON_PREFIX = 'anilist-person-';

const fetchPersonFull = async (id) => {
    if (!String(id).startsWith(PERSON_PREFIX)) {
        throw new Error('Este link usa um identificador antigo. Pesquise a pessoa novamente.');
    }

    return anilistApi.getPersonDetails(String(id).replace(PERSON_PREFIX, ''));
};

export function usePersonInfo(id) {
    const query = useQuery({
        queryKey: ['person-info', 'anilist-v2', id],
        queryFn: () => fetchPersonFull(id),
        staleTime: STALE_TIME_24H,
        enabled: !!id,
    });

    return {
        person: query.data?.person,
        voices: query.data?.voices || [],
        pictures: query.data?.pictures || [],
        animePositions: query.data?.animePositions || [],
        loading: query.isLoading,
        error: query.error
    };
}

export function useTopPeople() {
    return useInfiniteQuery({
        queryKey: ['top-people-anilist-infinite'],
        queryFn: ({ pageParam }) => anilistApi.getTopPeople(pageParam || 1, 25),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const pagination = lastPage?.pagination;
            if (!pagination?.has_next_page) return undefined;
            return (pagination.current_page || 0) + 1;
        },
        staleTime: STALE_TIME_24H,
        gcTime: STALE_TIME_24H,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 3000),
    });
}