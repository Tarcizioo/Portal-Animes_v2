import { describe, expect, it } from 'vitest';
import { getUrlFilters } from '../src/hooks/useCatalog';

describe('catalog URL filters', () => {
  it('interprets combined discovery shortcuts as catalog filters', () => {
    const filters = getUrlFilters(new URLSearchParams(
      'genre=1&genre=22&season=summer&year=2026&type=tv&orderBy=popularity',
    ));

    expect(filters).toMatchObject({
      genres: [1, 22],
      season: 'summer',
      year: '2026',
      type: 'tv',
      orderBy: 'popularity',
    });
  });

  it('preserves legacy search and single-genre URLs', () => {
    expect(getUrlFilters(new URLSearchParams('q=Monster'))).toMatchObject({ q: 'Monster' });
    expect(getUrlFilters(new URLSearchParams('genre=8'))).toMatchObject({ genres: [8] });
  });

  it('accepts format aliases and ignores unsupported URL values', () => {
    const filters = getUrlFilters(new URLSearchParams(
      'format=movie&orderBy=unsupported&season=invalid&year=1800',
    ));

    expect(filters).toMatchObject({ type: 'movie', orderBy: 'ranking', season: '', year: '' });
    expect(getUrlFilters(new URLSearchParams('type=studio'))).toBeNull();
  });
});
