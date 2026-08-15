import { describe, expect, it } from 'vitest';

import { selectHomeSections } from '../src/components/home/selectHomeSections';

describe('selectHomeSections', () => {
  it('deduplicates discovery titles across the hero, recommendations, library and editorial rails', () => {
    const result = selectHomeSections({
      featuredAnimes: [{ id: 1, title: 'Hero' }],
      recommendations: [{ id: 2, title: 'Recomendação' }],
      library: [{ id: 3, title: 'Biblioteca', status: 'watching' }],
      popularAnimes: [
        { id: 1, title: 'Hero repetido' },
        { id: 2, title: 'Recomendação repetida' },
        { id: 3, title: 'Biblioteca repetida' },
        { id: 4, title: 'Aclamação única' },
        { id: 4, title: 'Aclamação duplicada' },
        { id: 5, title: 'Outra aclamação' },
      ],
      seasonalAnimes: [
        { id: 1, title: 'Hero na temporada' },
        { id: 4, title: 'Aclamação na temporada' },
        { id: 5, title: 'Outra aclamação na temporada' },
        { id: 6, title: 'Temporada única' },
      ],
    });

    expect(result.acclaimed.map((anime) => anime.id)).toEqual([4, 5]);
    expect(result.seasonal.map((anime) => anime.id)).toEqual([6]);
  });

  it('puts favorite planned or paused titles first and maps totalEp to episodes', () => {
    const result = selectHomeSections({
      library: [
        {
          id: 1,
          status: 'paused',
          isFavorite: false,
          totalEp: 12,
          lastUpdated: { seconds: 300 },
        },
        {
          id: 2,
          status: 'plan_to_watch',
          isFavorite: true,
          totalEp: 24,
          lastUpdated: { seconds: 100 },
        },
        {
          id: 3,
          status: 'paused',
          isFavorite: true,
          totalEp: 13,
          lastUpdated: { seconds: 50 },
        },
        {
          id: 4,
          status: 'plan_to_watch',
          isFavorite: false,
          totalEp: 6,
          lastUpdated: { seconds: 400 },
        },
        {
          id: 5,
          status: 'watching',
          isFavorite: true,
          totalEp: 10,
          lastUpdated: { seconds: 500 },
        },
      ],
    });

    expect(result.nextChoices.map((anime) => anime.id)).toEqual([2, 3, 4, 1]);
    expect(result.nextChoices.map((anime) => anime.episodes)).toEqual([24, 13, 6, 12]);
    expect(result.nextChoices.every((anime) => anime.score === null)).toBe(true);
  });

  it('returns empty rails when the requested limit is zero', () => {
    const result = selectHomeSections({
      popularAnimes: [{ id: 1 }],
      seasonalAnimes: [{ id: 2 }],
      limit: 0,
    });

    expect(result.acclaimed).toEqual([]);
    expect(result.seasonal).toEqual([]);
  });
});
