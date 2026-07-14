import { describe, expect, it } from 'vitest';
import { mapAniListAnimeDetails } from '../src/services/anilistApi';

describe('AniList anime detail mapping', () => {
  it('maps one response into internal anime, cast, staff and recommendation routes', () => {
    const result = mapAniListAnimeDetails({
      idMal: 16498,
      title: { english: 'Attack on Titan', romaji: 'Shingeki no Kyojin', native: 'Shingeki' },
      coverImage: { extraLarge: 'https://example.com/cover.jpg' },
      description: 'First line<br><br>Second &amp; final line',
      bannerImage: 'https://example.com/banner.jpg',
      averageScore: 85,
      seasonYear: 2013,
      status: 'FINISHED',
      format: 'TV',
      episodes: 25,
      duration: 24,
      genres: ['Action', 'Drama'],
      popularity: 900000,
      rankings: [{ type: 'RATED', rank: 120, allTime: true }],
      characters: {
        edges: [{
          role: 'MAIN',
          node: { id: 45627, name: { full: 'Levi' }, image: { large: 'https://example.com/levi.jpg' } },
        }],
      },
      staff: {
        edges: [{
          role: 'Director',
          node: { id: 95075, name: { full: 'Tetsuro Araki' }, image: { large: 'https://example.com/araki.jpg' } },
        }],
      },
      recommendations: {
        nodes: [{
          rating: 50,
          mediaRecommendation: {
            idMal: 5114,
            title: { english: 'Fullmetal Alchemist: Brotherhood' },
            coverImage: { large: 'https://example.com/fmab.jpg' },
          },
        }],
      },
    });

    expect(result.data).toMatchObject({
      mal_id: 16498,
      title: 'Attack on Titan',
      banner_image: 'https://example.com/banner.jpg',
      status: 'Finished Airing',
      rank: 120,
      synopsis: 'First line\n\nSecond & final line',
    });
    expect(result.data.genres[0]).toEqual({ name: 'Action', mal_id: 1 });
    expect(result.characters[0].character.mal_id).toBe('anilist-character-45627');
    expect(result.staff[0].person.mal_id).toBe('anilist-person-95075');
    expect(result.recommendations[0].entry.mal_id).toBe(5114);
  });

  it('returns null for media without a MyAnimeList route', () => {
    expect(mapAniListAnimeDetails(null)).toBeNull();
    expect(mapAniListAnimeDetails({ idMal: null })).toBeNull();
  });
});
