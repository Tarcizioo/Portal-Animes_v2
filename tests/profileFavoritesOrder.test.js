import { describe, expect, it } from 'vitest';
import { getReorderedFavoriteIds } from '../src/components/profile/profileFavoritesOrder';

describe('favorite order helpers', () => {
  const visible = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const remaining = [{ id: 4 }, { id: 5 }];

  it('reorders the visible shelf while preserving the remaining favorites', () => {
    expect(getReorderedFavoriteIds(visible, remaining, 1, 3)).toEqual({
      visibleIds: [2, 3, 1],
      allIds: [2, 3, 1, 4, 5],
    });
  });

  it('ignores cancelled and invalid moves', () => {
    expect(getReorderedFavoriteIds(visible, remaining, 1, null)).toBeNull();
    expect(getReorderedFavoriteIds(visible, remaining, 1, 1)).toBeNull();
    expect(getReorderedFavoriteIds(visible, remaining, 99, 2)).toBeNull();
  });
});
