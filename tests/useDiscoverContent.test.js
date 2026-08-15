import { describe, expect, it } from 'vitest';
import {
  buildDiscoverGenreRows,
  dedupeDiscoverAnimes,
  getCurrentCatalogSeason,
} from '../src/hooks/useDiscoverContent';

describe('discover content helpers', () => {
  it('deduplicates mixed identifiers and excludes the featured title', () => {
    const first = { id: 1, title: 'Destaque' };
    const duplicate = { mal_id: 2, title: 'Duplicado' };

    expect(dedupeDiscoverAnimes([first, duplicate, { id: 2 }, { id: 3 }], [1]))
      .toEqual([duplicate, { id: 3 }]);
  });

  it.each([
    ['2026-01-15T12:00:00', 'winter'],
    ['2026-04-15T12:00:00', 'spring'],
    ['2026-07-15T12:00:00', 'summer'],
    ['2026-10-15T12:00:00', 'fall'],
  ])('maps %s to the matching catalog season', (date, expectedSeason) => {
    expect(getCurrentCatalogSeason(new Date(date))).toBe(expectedSeason);
  });

  it('builds all editorial rows while preferring and deduplicating direct data', () => {
    const shared = { id: 10, title: 'Ação direta', genres: ['Action'] };
    const actionPool = { id: 11, title: 'Ação do pool', genreIds: [1] };
    const rows = buildDiscoverGenreRows(
      [actionPool, { id: 20, title: 'Romance', genres: ['Romance'] }],
      [shared],
      { action: [shared, actionPool] },
    );

    expect(rows).toHaveLength(8);
    expect(rows.map((row) => row.title)).toEqual([
      'Ação e Adrenalina',
      'Romance e Amor',
      'Drama e Emoção',
      'Terror e Suspense',
      'Comédia e Diversão',
      'Mundo da Fantasia',
      'Ficção Científica',
      'Esportes & Competição',
    ]);
    expect(rows[0].animes.map((item) => item.id)).toEqual([10, 11]);
    expect(rows[1].animes.map((item) => item.id)).toEqual([20]);
  });
});
