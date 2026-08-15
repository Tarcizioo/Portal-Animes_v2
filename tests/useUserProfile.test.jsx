import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserProfile } from '../src/hooks/useUserProfile';

const profileMocks = vi.hoisted(() => ({
  doc: vi.fn((...parts) => parts.slice(1).join('/')),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
  user: { uid: 'user-1' },
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: profileMocks.user }),
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ toast: profileMocks.toast }),
}));

vi.mock('@/services/firebase', () => ({ db: {} }));

vi.mock('firebase/firestore', () => ({
  doc: profileMocks.doc,
  onSnapshot: profileMocks.onSnapshot,
  setDoc: profileMocks.setDoc,
}));

describe('useUserProfile subscription state', () => {
  beforeEach(() => {
    profileMocks.doc.mockClear();
    profileMocks.onSnapshot.mockReset();
    profileMocks.setDoc.mockReset();
    profileMocks.toast.error.mockReset();
    profileMocks.toast.success.mockReset();
    profileMocks.user = { uid: 'user-1' };
  });

  it('exposes a read error and can establish a fresh subscription', async () => {
    const subscriptions = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    profileMocks.onSnapshot.mockImplementation((_reference, onNext, onError) => {
      const subscription = { onNext, onError, unsubscribe: vi.fn() };
      subscriptions.push(subscription);
      return subscription.unsubscribe;
    });

    const { result } = renderHook(() => useUserProfile());
    await waitFor(() => expect(subscriptions).toHaveLength(1));

    const readError = new Error('permission-denied');
    act(() => subscriptions[0].onError(readError));

    expect(result.current.loading).toBe(false);
    expect(result.current.profile).toBeNull();
    expect(result.current.error).toBe(readError);

    act(() => result.current.retry());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    await waitFor(() => expect(subscriptions).toHaveLength(2));
    expect(subscriptions[0].unsubscribe).toHaveBeenCalledOnce();

    act(() => subscriptions[1].onNext({
      exists: () => true,
      data: () => ({ displayName: 'Akira', hasCompletedOnboarding: true }),
    }));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.profile).toMatchObject({ displayName: 'Akira' });
    consoleError.mockRestore();
  });
});
