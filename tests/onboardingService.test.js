import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  completeOnboarding,
  saveOnboardingProgress,
} from '../src/services/onboardingService';

const onboardingMocks = vi.hoisted(() => ({
  batchCommit: vi.fn(),
  batchSet: vi.fn(),
  doc: vi.fn((...parts) => parts.slice(1).join('/')),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  writeBatch: vi.fn(),
}));

vi.mock('@/services/firebase', () => ({ db: { name: 'database' } }));

vi.mock('firebase/firestore', () => ({
  doc: onboardingMocks.doc,
  getDoc: onboardingMocks.getDoc,
  serverTimestamp: onboardingMocks.serverTimestamp,
  writeBatch: onboardingMocks.writeBatch,
}));

describe('onboarding persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onboardingMocks.batchCommit.mockResolvedValue(undefined);
    onboardingMocks.getDoc.mockResolvedValue({ exists: () => false });
    onboardingMocks.writeBatch.mockReturnValue({
      commit: onboardingMocks.batchCommit,
      set: onboardingMocks.batchSet,
    });
  });

  it('saves sanitized progress through a batch', async () => {
    await saveOnboardingProgress({
      uid: 'user-1',
      displayName: '  Sakura Haruno  ',
      about: `  ${'a'.repeat(510)}  `,
      isPublic: false,
      step: 'privacy',
    });

    expect(onboardingMocks.writeBatch).toHaveBeenCalledWith({ name: 'database' });
    expect(onboardingMocks.batchSet).toHaveBeenCalledWith(
      'users/user-1',
      {
        displayName: 'Sakura Haruno',
        searchName: 'sakura haruno',
        about: 'a'.repeat(500),
        isPublic: false,
        onboardingVersion: 2,
        onboardingStep: 'privacy',
        onboardingUpdatedAt: 'server-timestamp',
      },
      { merge: true },
    );
    expect(onboardingMocks.batchCommit).toHaveBeenCalledOnce();
  });

  it('commits the completed profile and favorite anime in the same batch', async () => {
    await completeOnboarding({
      uid: 'user-1',
      displayName: 'Sakura',
      about: 'Gosto de shounen.',
      isPublic: true,
      favoriteAnime: {
        mal_id: 21,
        title: 'One Piece',
        title_english: 'One Piece',
        images: {
          webp: {
            large_image_url: 'https://cdn.example/one-piece-xl.webp',
            image_url: 'https://cdn.example/one-piece.webp',
          },
        },
        episodes: 1100,
        genres: [{ name: 'Action' }, { name: 'Adventure' }],
        studios: [{ name: 'Toei Animation' }],
        year: 1999,
        type: 'TV',
      },
    });

    expect(onboardingMocks.writeBatch).toHaveBeenCalledOnce();
    expect(onboardingMocks.batchSet).toHaveBeenNthCalledWith(
      1,
      'users/user-1',
      expect.objectContaining({
        displayName: 'Sakura',
        searchName: 'sakura',
        isPublic: true,
        onboardingVersion: 2,
        onboardingStep: 'complete',
        onboardingUpdatedAt: 'server-timestamp',
        hasCompletedOnboarding: true,
        onboardingCompletedAt: 'server-timestamp',
      }),
      { merge: true },
    );
    expect(onboardingMocks.batchSet).toHaveBeenNthCalledWith(
      2,
      'users/user-1/library/21',
      expect.objectContaining({
        id: '21',
        title: 'One Piece',
        image: 'https://cdn.example/one-piece-xl.webp',
        totalEp: 1100,
        genres: ['Action', 'Adventure'],
        studios: ['Toei Animation'],
        isFavorite: true,
        lastUpdated: 'server-timestamp',
        currentEp: 0,
        score: 0,
        status: 'plan_to_watch',
      }),
      { merge: true },
    );
    expect(onboardingMocks.batchCommit).toHaveBeenCalledOnce();
  });

  it('does not reset progress when the favorite already exists in the library', async () => {
    onboardingMocks.getDoc.mockResolvedValue({ exists: () => true });

    await completeOnboarding({
      uid: 'user-1',
      displayName: 'Sakura',
      isPublic: false,
      favoriteAnime: { mal_id: 21, title: 'One Piece' },
    });

    const favoriteWrite = onboardingMocks.batchSet.mock.calls[1][1];
    expect(favoriteWrite).toMatchObject({ id: '21', isFavorite: true });
    expect(favoriteWrite).not.toHaveProperty('currentEp');
    expect(favoriteWrite).not.toHaveProperty('score');
    expect(favoriteWrite).not.toHaveProperty('status');
  });

  it('completes without creating a library write when the favorite is skipped', async () => {
    await completeOnboarding({
      uid: 'user-1',
      displayName: 'Sakura',
      isPublic: false,
    });

    expect(onboardingMocks.batchSet).toHaveBeenCalledOnce();
    expect(onboardingMocks.batchSet).toHaveBeenCalledWith(
      'users/user-1',
      expect.objectContaining({
        onboardingStep: 'complete',
        hasCompletedOnboarding: true,
      }),
      { merge: true },
    );
    expect(onboardingMocks.batchCommit).toHaveBeenCalledOnce();
  });

  it('propagates a failed batch commit', async () => {
    const firestoreError = new Error('permission-denied');
    onboardingMocks.batchCommit.mockRejectedValue(firestoreError);

    await expect(saveOnboardingProgress({
      uid: 'user-1',
      step: 'identity',
    })).rejects.toBe(firestoreError);
  });
});
