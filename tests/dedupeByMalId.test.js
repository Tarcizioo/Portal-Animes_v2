import { describe, expect, it } from 'vitest';
import { dedupeByMalId } from '../src/utils/dedupeByMalId';

describe('dedupeByMalId', () => {
  it('keeps one item per MAL id and the latest payload', () => {
    const result = dedupeByMalId([
      { mal_id: 63537, name: 'First response' },
      { mal_id: 62683, name: 'Another character' },
      { mal_id: 63537, name: 'Updated response' },
    ]);

    expect(result).toEqual([
      { mal_id: 63537, name: 'Updated response' },
      { mal_id: 62683, name: 'Another character' },
    ]);
  });

  it('ignores malformed entries without an id', () => {
    expect(dedupeByMalId([null, {}, { mal_id: 1 }])).toEqual([{ mal_id: 1 }]);
  });
});
