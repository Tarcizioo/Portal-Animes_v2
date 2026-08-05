import { describe, expect, it } from 'vitest';
import {
  buildAniListCatalogVariables,
  getAniListDayRange,
  mapAniListArtwork,
  mapAniListRecommendations,
  mapAniListSchedules,
} from '../src/services/anilistApi';

describe('AniList catalog and discovery mappings', () => {
  it('maps catalog filters without sending inactive operators', () => {
    const variables = buildAniListCatalogVariables({
      q: '  Frieren ',
      genres: [22, 23],
      orderBy: 'favorites',
      status: 'complete',
      year: '2024',
      season: 'winter',
      type: 'tv',
      producers: '1977',
    }, 2, 24);

    expect(variables).toMatchObject({
      page: 2,
      perPage: 24,
      search: 'Frieren',
      genres: ['Romance'],
      tags: ['School'],
      season: 'WINTER',
      seasonYear: 2024,
      formats: ['TV', 'TV_SHORT'],
      statuses: ['FINISHED'],
      licensedBy: ['Netflix'],
      sort: ['FAVOURITES_DESC'],
    });
  });

  it('builds a local one-day range for the selected weekday', () => {
    const range = getAniListDayRange('monday', new Date(2026, 6, 14, 12));

    expect(new Date((range.start + 1) * 1000).getDay()).toBe(1);
    expect(range.end - (range.start + 1)).toBe(86400);
  });

  it('deduplicates scheduled media and keeps airing data', () => {
    const result = mapAniListSchedules({
      airingSchedules: [
        { airingAt: 100, episode: 2, media: { id: 1, idMal: 1, title: { romaji: 'Cowboy Bebop' } } },
        { airingAt: 200, episode: 3, media: { id: 1, idMal: 1, title: { romaji: 'Cowboy Bebop' } } },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ mal_id: 1, airing: { episode: 3, at: 200 } });
  });

  it('flattens and sorts recommendation batches', () => {
    const result = mapAniListRecommendations([{
      recommendations: {
        nodes: [
          { rating: 20, mediaRecommendation: { id: 2, idMal: 2, title: { romaji: 'B' } } },
          { rating: 50, mediaRecommendation: { id: 3, idMal: 3, title: { romaji: 'A' } } },
        ],
      },
    }]);

    expect(result.map((item) => item.entry.mal_id)).toEqual([3, 2]);
  });

  it('prefers banner artwork and falls back to the trailer thumbnail', () => {
    const result = mapAniListRecommendations([{
      recommendations: {
        nodes: [
          {
            rating: 20,
            mediaRecommendation: {
              id: 2,
              idMal: 2,
              title: { romaji: 'Trailer backdrop' },
              bannerImage: null,
              trailer: { thumbnail: 'trailer-backdrop' },
            },
          },
          {
            rating: 50,
            mediaRecommendation: {
              id: 3,
              idMal: 3,
              title: { romaji: 'Banner backdrop' },
              bannerImage: 'wide-banner',
              trailer: { thumbnail: 'trailer-fallback' },
            },
          },
        ],
      },
    }]);

    expect(result[0].entry.banner).toBe('wide-banner');
    expect(result[1].entry.banner).toBe('trailer-backdrop');
  });

  it('does not present image resolutions as different artwork', () => {
    const result = mapAniListArtwork({
      coverImage: { extraLarge: 'cover-xl', large: 'cover-large', medium: 'cover-medium' },
      bannerImage: 'banner',
      trailer: { thumbnail: 'trailer' },
    });

    expect(result).toEqual(['cover-xl', 'banner', 'trailer']);
  });

  it('maps the extended AniList genre and tag filters', () => {
    const variables = buildAniListCatalogVariables({
      genres: [9, 66, 1001, 1002, 1003, 1004, 1005],
    }, 1, 24);

    expect(variables.genres).toEqual(['Ecchi', 'Mahou Shoujo']);
    expect(variables.tags).toEqual(['Isekai', 'Historical', 'Military', 'Martial Arts', 'Space']);
  });});
