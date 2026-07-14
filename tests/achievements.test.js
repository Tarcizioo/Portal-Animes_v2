import { describe, expect, it } from 'vitest';
import { BADGES, getAchievementStats, getBadgeProgress } from '../src/constants/badges';

describe('profile achievements', () => {
  const library = [
    { id: 1, status: 'completed', currentEp: 24, score: 9, isFavorite: true, genres: ['Action', 'Fantasy'] },
    { id: 2, status: 'watching', currentEp: 8, score: 8, isFavorite: true, genres: ['Drama', 'Fantasy'] },
    { id: 3, status: 'plan_to_watch', currentEp: 0, score: 0, isFavorite: false, genres: ['Mystery'] },
  ];

  it('derives achievement metrics from the library without double-counting genres', () => {
    expect(getAchievementStats(library)).toEqual({
      totalAnimes: 3,
      completedAnimes: 1,
      episodesWatched: 32,
      ratedAnimes: 2,
      favoriteAnimes: 2,
      uniqueGenres: 4,
    });
  });

  it('keeps old badge ids compatible and reports measurable progress', () => {
    const firstStep = BADGES.find((badge) => badge.id === 'first_step');
    const marathonist = BADGES.find((badge) => badge.id === 'marathonist');
    const stats = getAchievementStats(library);

    expect(firstStep.requirement(stats)).toBe(true);
    expect(getBadgeProgress(marathonist, stats)).toMatchObject({
      value: 32,
      target: 100,
      percentage: 32,
    });
  });
});
