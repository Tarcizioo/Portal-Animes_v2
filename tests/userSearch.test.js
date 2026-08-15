import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(() => 'users'),
  getDocs: vi.fn(),
  limit: vi.fn((value) => ['limit', value]),
  query: vi.fn((...clauses) => clauses),
  where: vi.fn((...parts) => parts),
}));

vi.mock('firebase/firestore', () => firestoreMocks);

vi.mock('@/services/firebase', () => ({ db: {} }));

import { mergePublicUserSnapshots, searchPublicUsers } from '@/services/userSearch';

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
        { uid: '2', displayName: 'Levi Kazama', searchName: 'levi kazama', isPublic: true },
        { uid: '1', displayName: 'Levi', searchName: 'levi', isPublic: true },
        { uid: '3', displayName: 'Levi Privado', searchName: 'levi privado', isPublic: false },
      ]) },
      { status: 'fulfilled', value: snapshot([
        { uid: '1', displayName: 'Levi', searchName: 'levi', isPublic: true },
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

describe('searchPublicUsers', () => {
  beforeEach(() => {
    firestoreMocks.collection.mockClear();
    firestoreMocks.getDocs.mockReset().mockResolvedValue(snapshot([]));
    firestoreMocks.limit.mockClear();
    firestoreMocks.query.mockClear();
    firestoreMocks.where.mockClear();
  });

  it('adds an explicit public-profile constraint to every prefix query', async () => {
    await searchPublicUsers('Levi');

    const publicFilters = firestoreMocks.where.mock.calls.filter(([field, operator, value]) => (
      field === 'isPublic' && operator === '==' && value === true
    ));

    expect(publicFilters).toHaveLength(3);
    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(3);
  });
});
