import { useQuery } from '@tanstack/react-query';
import { anilistApi } from '@/services/anilistApi';

const CHARACTER_PREFIX = 'anilist-character-';

const fetchCharacterFull = async (id) => {
    if (!String(id).startsWith(CHARACTER_PREFIX)) {
        throw new Error('Este link usa um identificador antigo. Pesquise o personagem novamente.');
    }

    return anilistApi.getCharacterDetails(String(id).replace(CHARACTER_PREFIX, ''));
};

export function useCharacterInfo(id) {
    const query = useQuery({
        queryKey: ['character-info-full', 'anilist-v2', id],
        queryFn: () => fetchCharacterFull(id),
        staleTime: 1000 * 60 * 60 * 24,
        enabled: Boolean(id),
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * (attempt + 1), 3000),
    });

    return {
        character: query.data?.character,
        animeography: query.data?.animeography || [],
        voiceActors: query.data?.voiceActors || [],
        pictures: query.data?.pictures || [],
        loading: query.isLoading,
        error: query.error,
    };
}