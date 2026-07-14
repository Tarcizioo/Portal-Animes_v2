import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { anilistApi } from '@/services/anilistApi';
import { dedupeByMalId } from '@/utils/dedupeByMalId';

const STALE_TIME_24H = 1000 * 60 * 60 * 24;

export function useCharacters() {
    const query = useInfiniteQuery({
        queryKey: ['top-characters-anilist-infinite'],
        queryFn: ({ pageParam }) => anilistApi.getTopCharacters(pageParam, 25),
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

    const characters = useMemo(() => {
        const allCharacters = query.data?.pages.flatMap((page) => page.data || []) || [];
        return dedupeByMalId(allCharacters);
    }, [query.data]);

    return {
        characters,
        loading: query.isLoading || query.isFetchingNextPage,
        initialLoading: query.isLoading,
        loadMore: query.fetchNextPage,
        hasMore: Boolean(query.hasNextPage),
        error: query.error,
        retry: query.refetch,
    };
}