import { useEffect, useRef, useState } from 'react';
import { anilistApi } from '@/services/anilistApi';

const EMPTY_SEARCH = Object.freeze({
  status: 'idle',
  results: [],
  error: null,
});

export function useOnboardingAnimeSearch(query) {
  const normalizedQuery = query.trim();
  const latestRequestRef = useRef(0);
  const [retryToken, setRetryToken] = useState(0);
  const [state, setState] = useState(EMPTY_SEARCH);

  useEffect(() => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    if (normalizedQuery.length < 3) {
      const resetTimer = window.setTimeout(() => setState(EMPTY_SEARCH), 0);
      return () => window.clearTimeout(resetTimer);
    }

    const searchTimer = window.setTimeout(async () => {
      setState((current) => ({ ...current, status: 'searching', error: null }));

      try {
        const response = await anilistApi.searchCatalog(normalizedQuery, 6, {
          anime: true,
          characters: false,
          people: false,
        });

        if (latestRequestRef.current !== requestId) return;
        setState({
          status: 'success',
          results: response.anime || [],
          error: null,
        });
      } catch (error) {
        if (latestRequestRef.current !== requestId) return;
        console.error('Erro ao buscar anime no onboarding:', error);
        setState({
          status: 'error',
          results: [],
          error: 'Não foi possível buscar agora. Tente novamente.',
        });
      }
    }, 400);

    return () => window.clearTimeout(searchTimer);
  }, [normalizedQuery, retryToken]);

  const retry = () => setRetryToken((current) => current + 1);

  return { ...state, retry };
}
