import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { calculateGenreStats, useAnimeStats } from '../src/hooks/useAnimeStats';

const library = [
  {
    id: '1',
    title: 'Primeiro',
    status: 'watching',
    currentEp: 6,
    totalEp: 12,
    duration: 240,
    score: 8,
    isFavorite: true,
    genres: ['Ação', 'Drama'],
    type: 'TV',
  },
  {
    id: '2',
    title: 'Segundo',
    status: 'completed',
    currentEp: 24,
    totalEp: 24,
    duration: 1,
    score: 10,
    genres: ['Ação'],
    type: 'Filme',
  },
  {
    id: '3',
    title: 'Terceiro',
    status: 'plan_to_watch',
    currentEp: 5,
    totalEp: 0,
    score: 0,
    genres: ['Drama'],
    type: 'Filme',
  },
];

describe('useAnimeStats', () => {
  it('prioritizes episode progress without deriving time from duration', () => {
    const { result } = renderHook(() => useAnimeStats(library));

    expect(result.current.overview).toEqual({
      totalAnimes: 3,
      totalEpisodes: 35,
      progressEpisodes: 30,
      availableEpisodes: 36,
      episodeProgress: 83,
      averageScore: '9.0',
      favoritesCount: 1,
    });
    expect(result.current.overview).not.toHaveProperty('totalHours');
    expect(result.current.overview).not.toHaveProperty('totalDays');
    expect(result.current.status).toContainEqual(expect.objectContaining({ name: 'Assistindo', value: 1 }));
    expect(result.current.types[0]).toEqual({ name: 'Filme', value: 2 });
  });

  it('reports genre affinity in episodes and clamps known progress to one hundred percent', () => {
    const genres = calculateGenreStats(library);
    const { result } = renderHook(() => useAnimeStats([
      { ...library[0], currentEp: 20, totalEp: 12 },
    ]));

    expect(genres[0]).toMatchObject({
      name: 'Ação',
      total: 2,
      episodesRegistered: 30,
      averageScore: 9,
      percentage: 66.7,
    });
    expect(genres[0]).not.toHaveProperty('daysWatched');
    expect(result.current.overview).toMatchObject({
      totalEpisodes: 20,
      progressEpisodes: 12,
      availableEpisodes: 12,
      episodeProgress: 100,
    });
  });
});
