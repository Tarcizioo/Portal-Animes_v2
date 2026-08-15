import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFollowList } from '../src/hooks/useFollowList';

const firestore = vi.hoisted(() => ({
  callbacks: [],
  unsubscribe: vi.fn(),
  collection: vi.fn(() => ({ path: 'list' })),
  limit: vi.fn((value) => value),
  orderBy: vi.fn(() => ({ order: 'followedAt' })),
  query: vi.fn((value) => value),
  onSnapshot: vi.fn((_query, onNext, onError) => {
    firestore.callbacks.push({ onNext, onError });
    return firestore.unsubscribe;
  }),
}));

vi.mock('firebase/firestore', () => ({
  collection: firestore.collection,
  limit: firestore.limit,
  onSnapshot: firestore.onSnapshot,
  orderBy: firestore.orderBy,
  query: firestore.query,
}));

vi.mock('@/services/firebase', () => ({ db: { name: 'database' } }));

describe('useFollowList', () => {
  beforeEach(() => {
    firestore.callbacks = [];
    firestore.onSnapshot.mockClear();
    firestore.unsubscribe.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes subscription errors and resubscribes on retry', async () => {
    const { result } = renderHook(() => useFollowList('profile-1', 'followers'));

    expect(result.current.loading).toBe(true);
    expect(firestore.onSnapshot).toHaveBeenCalledOnce();

    const failure = new Error('offline');
    act(() => firestore.callbacks[0].onError(failure));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(failure);
    expect(result.current.list).toEqual([]);

    act(() => result.current.retry());

    await waitFor(() => expect(firestore.onSnapshot).toHaveBeenCalledTimes(2));
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    act(() => firestore.callbacks[1].onNext({
      docs: [{ id: 'person-2', data: () => ({ displayName: 'Mika' }) }],
    }));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.list).toEqual([{ uid: 'person-2', displayName: 'Mika' }]);
  });
});
