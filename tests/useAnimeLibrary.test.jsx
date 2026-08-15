import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnimeLibrary } from '../src/hooks/useAnimeLibrary';

const libraryMocks = vi.hoisted(() => ({
  collection: vi.fn((...parts) => parts.slice(1).join('/')),
  deleteDoc: vi.fn(),
  doc: vi.fn((...parts) => parts.slice(1).join('/')),
  getDoc: vi.fn(),
  increment: vi.fn((value) => `increment:${value}`),
  onSnapshot: vi.fn(),
  query: vi.fn((value) => value),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  setDoc: vi.fn(),
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
  trackProductEvent: vi.fn(),
  transactionCommitted: vi.fn(),
  transactionGet: vi.fn(),
  transactionUpdate: vi.fn(),
  unsubscribe: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1' } }),
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ toast: libraryMocks.toast }),
}));

vi.mock('@/services/firebase', () => ({ db: {} }));

vi.mock('@/services/anilistApi', () => ({
  anilistApi: { getAnimeByMalIds: vi.fn() },
}));

vi.mock('@/services/productAnalytics', () => ({
  PRODUCT_EVENTS: {
    LIBRARY_UPDATED: 'library_updated',
    PROGRESS_UPDATED: 'progress_updated',
  },
  trackProductEvent: libraryMocks.trackProductEvent,
}));

vi.mock('firebase/firestore', () => ({
  collection: libraryMocks.collection,
  deleteDoc: libraryMocks.deleteDoc,
  doc: libraryMocks.doc,
  getDoc: libraryMocks.getDoc,
  increment: libraryMocks.increment,
  onSnapshot: libraryMocks.onSnapshot,
  query: libraryMocks.query,
  runTransaction: libraryMocks.runTransaction,
  serverTimestamp: libraryMocks.serverTimestamp,
  setDoc: libraryMocks.setDoc,
  updateDoc: libraryMocks.updateDoc,
}));

describe('anime library write integrity and analytics', () => {
  beforeEach(() => {
    libraryMocks.onSnapshot.mockReset();
    libraryMocks.onSnapshot.mockReturnValue(libraryMocks.unsubscribe);
    libraryMocks.deleteDoc.mockReset();
    libraryMocks.deleteDoc.mockResolvedValue(undefined);
    libraryMocks.setDoc.mockResolvedValue(undefined);
    libraryMocks.runTransaction.mockImplementation(async (_db, operation) => {
      const result = await operation({
        get: libraryMocks.transactionGet,
        update: libraryMocks.transactionUpdate,
      });
      libraryMocks.transactionCommitted();
      return result;
    });
    libraryMocks.trackProductEvent.mockResolvedValue(true);
  });

  it('exposes a subscription error and retries with a fresh listener', async () => {
    const subscriptions = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    libraryMocks.onSnapshot.mockImplementation((_reference, onNext, onError) => {
      const subscription = { onNext, onError, unsubscribe: vi.fn() };
      subscriptions.push(subscription);
      return subscription.unsubscribe;
    });

    const { result } = renderHook(() => useAnimeLibrary());
    await waitFor(() => expect(subscriptions).toHaveLength(1));

    const readError = new Error('permission-denied');
    act(() => subscriptions[0].onError(readError));

    expect(result.current.loading).toBe(false);
    expect(result.current.library).toEqual([]);
    expect(result.current.error).toBe(readError);

    act(() => result.current.retry());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    await waitFor(() => expect(subscriptions).toHaveLength(2));
    expect(subscriptions[0].unsubscribe).toHaveBeenCalledOnce();

    act(() => subscriptions[1].onNext({
      docs: [{ id: '21', data: () => ({ title: 'One Piece' }) }],
    }));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.library).toEqual([{ id: '21', title: 'One Piece' }]);
    consoleError.mockRestore();
  });

  it('recalculates a concurrent retry and commits before toast and tracking', async () => {
    const abandonedUpdate = vi.fn();
    libraryMocks.transactionGet
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ currentEp: 2 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ currentEp: 4 }),
      });
    libraryMocks.runTransaction.mockImplementation(async (_db, operation) => {
      await operation({
        get: libraryMocks.transactionGet,
        update: abandonedUpdate,
      });
      const result = await operation({
        get: libraryMocks.transactionGet,
        update: libraryMocks.transactionUpdate,
      });
      libraryMocks.transactionCommitted();
      return result;
    });
    const { result } = renderHook(() => useAnimeLibrary());

    await act(async () => {
      await result.current.updateProgress('21', 5, 5, { source: 'library' });
    });

    expect(libraryMocks.runTransaction).toHaveBeenCalledWith({}, expect.any(Function));
    expect(libraryMocks.transactionGet).toHaveBeenCalledTimes(2);
    expect(libraryMocks.transactionGet).toHaveBeenLastCalledWith(
      'users/user-1/library/21',
    );
    expect(Object.values(abandonedUpdate.mock.calls[1][1])).toEqual(['increment:3']);
    expect(libraryMocks.transactionUpdate).toHaveBeenNthCalledWith(
      1,
      'users/user-1/library/21',
      {
        currentEp: 5,
        lastUpdated: 'server-timestamp',
        lastProgressAt: 'server-timestamp',
        status: 'completed',
      },
    );

    const [userReference, activityUpdate] = libraryMocks.transactionUpdate.mock.calls[1];
    expect(userReference).toBe('users/user-1');
    expect(Object.keys(activityUpdate)).toEqual([
      expect.stringMatching(/^activityLog\.\d{4}-\d{2}-\d{2}$/),
    ]);
    expect(Object.values(activityUpdate)).toEqual(['increment:1']);
    expect(libraryMocks.transactionCommitted).toHaveBeenCalledOnce();
    expect(libraryMocks.toast.success).toHaveBeenCalledWith(
      'Anime concluído!',
      'Parabéns',
    );
    expect(libraryMocks.trackProductEvent).toHaveBeenCalledWith('progress_updated', {
      anime_id: 21,
      episode: 5,
      previous_episode: 4,
      total_episodes: 5,
      source: 'library',
    });
    expect(libraryMocks.transactionCommitted.mock.invocationCallOrder[0])
      .toBeLessThan(libraryMocks.toast.success.mock.invocationCallOrder[0]);
    expect(libraryMocks.transactionCommitted.mock.invocationCallOrder[0])
      .toBeLessThan(libraryMocks.trackProductEvent.mock.invocationCallOrder[0]);
  });

  it('propagates a failed commit, shows an error, and does not track progress', async () => {
    const firestoreError = new Error('permission-denied');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    libraryMocks.transactionGet.mockResolvedValue({
      exists: () => true,
      data: () => ({ currentEp: 2 }),
    });
    libraryMocks.runTransaction.mockImplementation(async (_db, operation) => {
      await operation({
        get: libraryMocks.transactionGet,
        update: libraryMocks.transactionUpdate,
      });
      throw firestoreError;
    });
    const { result } = renderHook(() => useAnimeLibrary());

    await act(async () => {
      await expect(
        result.current.updateProgress('21', 3, 12, { source: 'library' }),
      ).rejects.toBe(firestoreError);
    });

    expect(libraryMocks.toast.error).toHaveBeenCalledWith(
      'Falha ao salvar progresso.',
      'Erro',
    );
    expect(libraryMocks.toast.success).not.toHaveBeenCalled();
    expect(libraryMocks.transactionCommitted).not.toHaveBeenCalled();
    expect(libraryMocks.trackProductEvent).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('does not emit an add event when an existing library item is merged', async () => {
    libraryMocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ currentEp: 4, isFavorite: true }),
    });
    const { result } = renderHook(() => useAnimeLibrary());

    await act(async () => {
      await result.current.addToLibrary(
        { id: 21, title: 'One Piece', episodes: 1100 },
        'watching',
        { source: 'library' },
      );
    });

    expect(libraryMocks.setDoc).toHaveBeenCalledWith(
      'users/user-1/library/21',
      expect.objectContaining({
        id: '21',
        currentEp: 4,
        isFavorite: true,
        status: 'watching',
      }),
      { merge: true },
    );
    expect(libraryMocks.trackProductEvent).not.toHaveBeenCalled();
  });

  it('creates a new favorite in one library write', async () => {
    libraryMocks.getDoc.mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    });
    const { result } = renderHook(() => useAnimeLibrary());

    await act(async () => {
      await result.current.toggleFavorite(
        { id: 21, title: 'One Piece', episodes: 1100 },
        { source: 'onboarding' },
      );
    });

    expect(libraryMocks.setDoc).toHaveBeenCalledWith(
      'users/user-1/library/21',
      expect.objectContaining({ isFavorite: true }),
      { merge: true },
    );
    expect(libraryMocks.updateDoc).not.toHaveBeenCalled();
  });

  it('propagates a failed removal without tracking it as completed', async () => {
    const firestoreError = new Error('permission-denied');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    libraryMocks.deleteDoc.mockRejectedValueOnce(firestoreError);
    const { result } = renderHook(() => useAnimeLibrary());

    await act(async () => {
      await expect(
        result.current.removeFromLibrary('21', { source: 'library' }),
      ).rejects.toBe(firestoreError);
    });

    expect(libraryMocks.toast.error).toHaveBeenCalledWith('Erro ao remover anime.', 'Erro');
    expect(libraryMocks.toast.info).not.toHaveBeenCalled();
    expect(libraryMocks.trackProductEvent).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
