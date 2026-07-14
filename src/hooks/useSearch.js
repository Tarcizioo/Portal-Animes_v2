import { useEffect, useState } from 'react';
import { anilistApi } from '@/services/anilistApi';

function toInstantAnime(anime) {
  return {
    id: anime.mal_id,
    title: anime.title_english || anime.title,
    image: anime.images?.jpg?.image_url,
    score: anime.score,
    year: anime.year || 'N/A',
    status: anime.status,
    type: anime.type,
    kind: 'anime',
  };
}

function toInstantCharacter(character) {
  return {
    id: character.mal_id,
    title: character.name,
    image: character.images?.jpg?.image_url,
    kind: 'character',
  };
}

function toInstantPerson(person) {
  return {
    id: person.mal_id,
    title: person.name,
    image: person.images?.jpg?.image_url,
    kind: 'person',
  };
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) {
      setResults([]);
      setIsSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);

      try {
        if (type === 'studio') {
          const data = await anilistApi.searchStudios(normalizedQuery, 6, { signal });
          const studios = (data.data || []).map((studio) => ({
            id: studio.id || studio.mal_id,
            title: studio.title || studio.name || 'Estudio',
            image: studio.images?.jpg?.image_url,
            kind: 'studio',
          }));
          if (!signal.aborted) setResults(studios);
          return;
        }

        const catalog = await anilistApi.searchCatalog(
          normalizedQuery,
          6,
          {
            anime: type === 'all' || type === 'anime',
            characters: type === 'all' || type === 'character',
            people: type === 'all' || type === 'person',
          },
          { signal }
        );

        if (signal.aborted) return;

        if (type === 'anime') {
          setResults(catalog.anime.map(toInstantAnime));
        } else if (type === 'character') {
          setResults(catalog.characters.map(toInstantCharacter));
        } else if (type === 'person') {
          setResults(catalog.people.map(toInstantPerson));
        } else {
          setResults([
            ...catalog.anime.slice(0, 3).map(toInstantAnime),
            ...catalog.characters.slice(0, 2).map(toInstantCharacter),
            ...catalog.people.slice(0, 2).map(toInstantPerson),
          ]);
        }
      } catch (error) {
        if (error.name !== 'AbortError' && !signal.aborted) setResults([]);
      } finally {
        if (!signal.aborted) setIsSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(delayDebounce);
      controller.abort();
    };
  }, [query, type]);

  return { query, setQuery, type, setType, results, isSearching, setResults };
}