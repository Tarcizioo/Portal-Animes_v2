import { describe, expect, it } from 'vitest';
import { LIBRARY_GENRE_ID_MAP } from '../src/constants/libraryGenres';

describe('library genre filters', () => {
  it('maps the School and Seinen filter IDs used by the UI', () => {
    expect(LIBRARY_GENRE_ID_MAP[23]).toBe('School');
    expect(LIBRARY_GENRE_ID_MAP[42]).toBe('Seinen');
  });
});
