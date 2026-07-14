import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const CACHE_TIME = 1000 * 60 * 60 * 24; // 24 horas

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: CACHE_TIME, // Tempo para garbage collection (antigo cacheTime)
            staleTime: CACHE_TIME, // Tempo que o dado é considerado fresco
            retry: 1,
        },
    },
});

const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
});

// Ativa persistência global
persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: CACHE_TIME, // Expira em 24h
});
