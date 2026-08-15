import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useComments } from '../src/hooks/useComments';

const commentMocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  arrayRemove: vi.fn(),
  arrayUnion: vi.fn(),
  collection: vi.fn((...parts) => parts.slice(1).join('/')),
  deleteDoc: vi.fn(),
  doc: vi.fn((...parts) => parts.slice(1).join('/')),
  increment: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn((value) => value),
  serverTimestamp: vi.fn(),
  unsubscribe: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user-1', displayName: 'Spike' } }),
}));

vi.mock('@/services/firebase', () => ({ db: {} }));

vi.mock('@/services/notificationService', () => ({
  notifyCommentLike: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  addDoc: commentMocks.addDoc,
  arrayRemove: commentMocks.arrayRemove,
  arrayUnion: commentMocks.arrayUnion,
  collection: commentMocks.collection,
  deleteDoc: commentMocks.deleteDoc,
  doc: commentMocks.doc,
  increment: commentMocks.increment,
  onSnapshot: commentMocks.onSnapshot,
  query: commentMocks.query,
  serverTimestamp: commentMocks.serverTimestamp,
  updateDoc: commentMocks.updateDoc,
  where: commentMocks.where,
}));

const storedComment = {
  id: 'comment-1',
  animeId: '1',
  userId: 'user-1',
  content: 'See you, space cowboy.',
  createdAt: { toMillis: () => 1 },
};

describe('comment deletion integrity', () => {
  beforeEach(() => {
    commentMocks.onSnapshot.mockImplementation((_query, onNext) => {
      onNext({
        docs: [{
          id: storedComment.id,
          data: () => ({ ...storedComment }),
        }],
      });
      return commentMocks.unsubscribe;
    });
  });

  it('keeps the comment visible until Firestore confirms deletion', async () => {
    let resolveDeletion;
    commentMocks.deleteDoc.mockReturnValue(new Promise((resolve) => {
      resolveDeletion = resolve;
    }));
    const { result } = renderHook(() => useComments('1'));

    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    let deletion;
    act(() => {
      deletion = result.current.deleteComment('comment-1');
    });

    await Promise.resolve();
    expect(commentMocks.deleteDoc).toHaveBeenCalledWith('comments/comment-1');
    expect(result.current.comments).toHaveLength(1);

    await act(async () => {
      resolveDeletion();
      await deletion;
    });

    expect(result.current.comments).toHaveLength(0);
  });

  it('propagates a Firestore failure without removing the local comment', async () => {
    const firestoreError = new Error('permission-denied');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    commentMocks.deleteDoc.mockRejectedValue(firestoreError);
    const { result } = renderHook(() => useComments('1'));

    await waitFor(() => expect(result.current.comments).toHaveLength(1));

    await expect(result.current.deleteComment('comment-1')).rejects.toBe(firestoreError);

    expect(result.current.comments).toHaveLength(1);
    expect(consoleError).toHaveBeenCalledWith('Erro ao deletar comentário:', firestoreError);
    consoleError.mockRestore();
  });
});
