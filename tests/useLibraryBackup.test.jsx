import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLibraryBackup } from '../src/hooks/useLibraryBackup';

const backupMocks = vi.hoisted(() => ({
  getAnimeByMalIds: vi.fn(),
  setDoc: vi.fn(),
  doc: vi.fn((...parts) => parts.slice(1).join('/')),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));

vi.mock('@/services/firebase', () => ({ db: {} }));

vi.mock('@/services/anilistApi', () => ({
  anilistApi: { getAnimeByMalIds: backupMocks.getAnimeByMalIds },
}));

vi.mock('firebase/firestore', () => ({
  doc: backupMocks.doc,
  setDoc: backupMocks.setDoc,
  serverTimestamp: backupMocks.serverTimestamp,
}));

describe('MyAnimeList library import', () => {
  beforeEach(() => {
    backupMocks.getAnimeByMalIds.mockResolvedValue({ data: [] });
    backupMocks.setDoc.mockResolvedValue(undefined);
  });

  it('normalizes On-Hold entries to the supported paused status', async () => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<myanimelist><anime>',
      '<series_animedb_id>1</series_animedb_id>',
      '<series_title>Cowboy Bebop</series_title>',
      '<series_episodes>26</series_episodes>',
      '<my_watched_episodes>8</my_watched_episodes>',
      '<my_score>9</my_score>',
      '<my_status>On-Hold</my_status>',
      '<series_type>TV</series_type>',
      '</anime></myanimelist>',
    ].join('');
    const file = new File([xml], 'anime-list.xml', { type: 'text/xml' });
    const { result } = renderHook(() => useLibraryBackup());

    const parsed = await result.current.parseMAL(file);

    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]).toMatchObject({
      id: '1',
      status: 'paused',
      currentEp: 8,
      totalEp: 26,
    });

    await result.current.commitImport(parsed.items, true);

    expect(backupMocks.setDoc).toHaveBeenCalledWith(
      'users/user-1/library/1',
      expect.objectContaining({ status: 'paused' }),
      { merge: false },
    );
  });
});
