import { describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock('@/services/firebase', () => ({ db: {} }));

import { mergePublicUserSnapshots } from '@/services/userSearch';

function snapshot(users) {
  return {
    docs: users.map(({ uid, ...data }) => ({
      id: uid,
      data: () => data,
    })),
  };
}

describe('mergePublicUserSnapshots', () => {
  it('deduplicates users, removes private profiles and prioritizes exact matches', () => {
    const result = mergePublicUserSnapshots([
      { status: 'fulfilled', value: snapshot([
        { uid: '2', displayName: 'Levi Kazama', searchName: 'levi kazama' },
        { uid: '1', displayName: 'Levi', searchName: 'levi' },
        { uid: '3', displayName: 'Levi Privado', searchName: 'levi privado', isPublic: false },
      ]) },
      { status: 'fulfilled', value: snapshot([
        { uid: '1', displayName: 'Levi', searchName: 'levi' },
      ]) },
      { status: 'rejected', reason: new Error('legacy index unavailable') },
    ], 'levi');

    expect(result.users.map((user) => user.uid)).toEqual(['1', '2']);
    expect(result.partialFailure).toBe(true);
  });

  it('fails only when every Firebase query fails', () => {
    expect(() => mergePublicUserSnapshots([
      { status: 'rejected', reason: new Error('permission denied') },
      { status: 'rejected', reason: new Error('index unavailable') },
    ], 'levi')).toThrow('Não foi possível consultar os perfis agora.');
  });
});
