import { describe, expect, it } from 'vitest';
import {
  mapAniListAnimeDetails,
  mapAniListStudioDetails,
  mapAniListStudios,
} from '../src/services/anilistApi';

describe('AniList studio mappings', () => {
  it('creates internal routes for studio search and details', () => {
    const search = mapAniListStudios({
      studios: [{ id: 21, name: 'Studio Ghibli', favourites: 100 }],
      pageInfo: { currentPage: 1, hasNextPage: false },
    });
    const details = mapAniListStudioDetails({
      id: 21,
      name: 'Studio Ghibli',
      isAnimationStudio: true,
      media: {
        pageInfo: { currentPage: 1, hasNextPage: true, total: 500 },
        nodes: [{
          idMal: 199,
          title: { english: 'Spirited Away' },
          coverImage: { extraLarge: 'https://example.com/spirited-away.jpg' },
          popularity: 1000,
        }],
      },
    });

    expect(search.data[0].id).toBe('anilist-studio-21');
    expect(details.studio).toMatchObject({ id: 'anilist-studio-21', count: 500 });
    expect(details.data[0]).toMatchObject({ mal_id: 199, members: 1000 });
    expect(details.pagination.has_next_page).toBe(true);
  });

  it('links anime studios to internal profiles', () => {
    const result = mapAniListAnimeDetails({
      idMal: 16498,
      title: { english: 'Attack on Titan' },
      studios: { nodes: [{ id: 858, name: 'WIT STUDIO' }] },
    });

    expect(result.data.studios[0]).toEqual({
      name: 'WIT STUDIO',
      mal_id: 'anilist-studio-858',
    });
  });
});
