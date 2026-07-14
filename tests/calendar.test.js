import { describe, expect, it } from 'vitest';
import { dedupeSchedules } from '../src/hooks/useCalendar';

describe('calendar schedule normalization', () => {
  it('keeps only one card for each MyAnimeList anime ID', () => {
    const result = dedupeSchedules([
      { mal_id: 62542, title: 'Grand Blue Season 3' },
      { mal_id: 62542, title: 'Grand Blue Season 3 duplicate' },
      { mal_id: 62331, title: 'Liar Game' },
      { mal_id: null, title: 'No internal route' },
    ]);

    expect(result).toEqual([
      { mal_id: 62542, title: 'Grand Blue Season 3 duplicate' },
      { mal_id: 62331, title: 'Liar Game' },
    ]);
  });
});
