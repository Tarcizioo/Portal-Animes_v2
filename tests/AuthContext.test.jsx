import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

const analyticsMocks = vi.hoisted(() => ({
  trackProductEvent: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  credential: vi.fn(),
  onAuthChanged: vi.fn(),
  reauthCredential: vi.fn(),
  reauthPopup: vi.fn(),
  sendVerification: vi.fn(),
  sendReset: vi.fn(),
  signInEmail: vi.fn(),
  signInPopup: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
  updateProfile: vi.fn(),
}));

const firestoreMocks = vi.hoisted(() => ({
  arrayRemove: vi.fn((value) => ({ operation: 'arrayRemove', value })),
  collection: vi.fn((...parts) => parts.join('/')),
  collectionGroup: vi.fn((_db, name) => `collection-group/${name}`),
  deleteDoc: vi.fn(),
  doc: vi.fn((...parts) => parts.slice(1).join('/')),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  increment: vi.fn((value) => ({ operation: 'increment', value })),
  query: vi.fn((value) => value),
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  setDoc: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(),
}));

const firebaseServices = vi.hoisted(() => ({
  auth: { currentUser: null },
  db: { name: 'db' },
  googleProvider: { providerId: 'google.com' },
}));

const toastApi = vi.hoisted(() => ({
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock('@/services/firebase', () => firebaseServices);

vi.mock('@/services/productAnalytics', () => ({
  PRODUCT_EVENTS: {
    LOGIN: 'login',
    SIGN_UP: 'sign_up',
  },
  trackProductEvent: analyticsMocks.trackProductEvent,
}));

vi.mock('@/context/ToastContext', () => ({
  useToast: () => ({ toast: toastApi }),
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: authMocks.createUser,
  deleteUser: authMocks.deleteUser,
  EmailAuthProvider: { credential: authMocks.credential },
  onAuthStateChanged: authMocks.onAuthChanged,
  reauthenticateWithCredential: authMocks.reauthCredential,
  reauthenticateWithPopup: authMocks.reauthPopup,
  sendEmailVerification: authMocks.sendVerification,
  sendPasswordResetEmail: authMocks.sendReset,
  signInWithEmailAndPassword: authMocks.signInEmail,
  signInWithPopup: authMocks.signInPopup,
  signOut: authMocks.signOut,
  updateProfile: authMocks.updateProfile,
}));

vi.mock('firebase/firestore', () => ({
  arrayRemove: firestoreMocks.arrayRemove,
  collection: firestoreMocks.collection,
  collectionGroup: firestoreMocks.collectionGroup,
  deleteDoc: firestoreMocks.deleteDoc,
  doc: firestoreMocks.doc,
  getDoc: firestoreMocks.getDoc,
  getDocs: firestoreMocks.getDocs,
  increment: firestoreMocks.increment,
  query: firestoreMocks.query,
  serverTimestamp: firestoreMocks.serverTimestamp,
  setDoc: firestoreMocks.setDoc,
  where: firestoreMocks.where,
  writeBatch: firestoreMocks.writeBatch,
}));

function AuthProbe() {
  const { signUpEmail, signInEmail, signInGoogle, deleteAccount } = useAuth();

  return (
    <>
      <button
        type="button"
        onClick={() => signUpEmail({
          displayName: 'Sakura',
          email: ' sakura@example.com ',
          password: 'senha-segura',
        })}
      >
        Cadastrar
      </button>
      <button type="button" onClick={() => signInEmail(' user@example.com ', 'senha')}>
        Entrar
      </button>
      <button type="button" onClick={() => signInGoogle()}>
        Entrar com Google
      </button>
      <button type="button" onClick={() => deleteAccount('senha-atual')}>
        Excluir
      </button>
    </>
  );
}

async function renderProvider() {
  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );
  return screen.findByRole('button', { name: 'Cadastrar' });
}

describe('AuthContext email authentication', () => {
  beforeEach(() => {
    Object.values(authMocks).forEach((mock) => mock.mockReset());
    Object.values(firestoreMocks).forEach((mock) => mock.mockClear());
    analyticsMocks.trackProductEvent.mockReset();
    toastApi.info.mockReset();
    toastApi.error.mockReset();
    firebaseServices.auth.currentUser = null;

    authMocks.onAuthChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return authMocks.unsubscribe;
    });
    authMocks.sendVerification.mockResolvedValue(undefined);
    authMocks.deleteUser.mockResolvedValue(undefined);
    authMocks.updateProfile.mockResolvedValue(undefined);
    firestoreMocks.getDoc.mockResolvedValue({ exists: () => false });
    firestoreMocks.getDocs.mockResolvedValue({ docs: [], empty: true });
    firestoreMocks.setDoc.mockResolvedValue(undefined);
    firestoreMocks.deleteDoc.mockResolvedValue(undefined);
    firestoreMocks.writeBatch.mockReturnValue({
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('creates an email account without writing credentials to the public profile', async () => {
    const user = userEvent.setup();
    const createdUser = {
      uid: 'new-user',
      displayName: null,
      photoURL: null,
      providerData: [{ providerId: 'password' }],
    };
    authMocks.createUser.mockResolvedValue({ user: createdUser });

    await renderProvider();
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => expect(firestoreMocks.setDoc).toHaveBeenCalled());
    expect(authMocks.createUser).toHaveBeenCalledWith(firebaseServices.auth, 'sakura@example.com', 'senha-segura');
    expect(authMocks.updateProfile).toHaveBeenCalledWith(createdUser, { displayName: 'Sakura' });

    const publicProfile = firestoreMocks.setDoc.mock.calls[0][1];
    expect(publicProfile).toMatchObject({
      uid: 'new-user',
      displayName: 'Sakura',
      searchName: 'sakura',
      hasCompletedOnboarding: false,
      isPublic: false,
    });
    expect(publicProfile).not.toHaveProperty('email');
    expect(publicProfile).not.toHaveProperty('password');
    expect(authMocks.sendVerification).toHaveBeenCalledWith(createdUser);
    expect(analyticsMocks.trackProductEvent).toHaveBeenCalledWith('sign_up', { method: 'email' });
  });

  it('repairs a placeholder profile created by the auth observer during email signup', async () => {
    const user = userEvent.setup();
    const createdUser = {
      uid: 'racing-user',
      displayName: null,
      photoURL: null,
      providerData: [{ providerId: 'password' }],
    };
    authMocks.createUser.mockResolvedValue({ user: createdUser });
    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'racing-user',
        displayName: 'Usuário',
        searchName: 'usuário',
        photoURL: null,
        bannerURL: null,
        hasCompletedOnboarding: false,
        isPublic: true,
        createdAt: 'timestamp',
        stats: { watchedAnimes: 0, episodesWatched: 0, meanScore: 0 },
      }),
    });

    await renderProvider();
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => {
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        'users/racing-user',
        { displayName: 'Sakura', searchName: 'sakura' },
        { merge: true },
      );
    });
  });

  it('trims the email before signing in', async () => {
    const user = userEvent.setup();
    const signedInUser = {
      uid: 'existing-user',
      displayName: 'Usuário',
      photoURL: null,
      providerData: [{ providerId: 'password' }],
    };
    authMocks.signInEmail.mockResolvedValue({ user: signedInUser });
    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'existing-user',
        displayName: 'Usuário',
        searchName: 'usuário',
        photoURL: null,
        bannerURL: null,
        hasCompletedOnboarding: true,
        createdAt: 'timestamp',
        stats: { watchedAnimes: 0, episodesWatched: 0, meanScore: 0 },
      }),
    });

    await renderProvider();
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(authMocks.signInEmail).toHaveBeenCalledWith(firebaseServices.auth, 'user@example.com', 'senha');
    });
    expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
      'users/existing-user',
      { isPublic: false },
      { merge: true },
    );
    expect(analyticsMocks.trackProductEvent).toHaveBeenCalledWith('login', { method: 'email' });
  });

  it('grandfathers an existing profile created before the onboarding flag', async () => {
    const user = userEvent.setup();
    const signedInUser = {
      uid: 'legacy-user',
      displayName: 'Usuário legado',
      photoURL: null,
      providerData: [{ providerId: 'password' }],
    };
    authMocks.signInEmail.mockResolvedValue({ user: signedInUser });
    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        uid: 'legacy-user',
        displayName: 'Usuário legado',
        searchName: 'usuário legado',
        photoURL: null,
        bannerURL: null,
        isPublic: false,
        createdAt: 'timestamp',
        stats: { watchedAnimes: 0, episodesWatched: 0, meanScore: 0 },
      }),
    });

    await renderProvider();
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
        'users/legacy-user',
        { hasCompletedOnboarding: true },
        { merge: true },
      );
    });
  });

  it('tracks a successful Google login without personal identifiers', async () => {
    const user = userEvent.setup();
    const signedInUser = {
      uid: 'google-user',
      displayName: 'Sakura',
      email: 'sakura@example.com',
      photoURL: null,
      providerData: [{ providerId: 'google.com' }],
    };
    authMocks.signInPopup.mockResolvedValue({ user: signedInUser });

    await renderProvider();
    await user.click(screen.getByRole('button', { name: 'Entrar com Google' }));

    await waitFor(() => {
      expect(authMocks.signInPopup).toHaveBeenCalledWith(firebaseServices.auth, firebaseServices.googleProvider);
    });
    expect(analyticsMocks.trackProductEvent).toHaveBeenCalledWith('login', { method: 'google' });
  });

  it('reauthenticates password users before deleting Firestore data', async () => {
    const user = userEvent.setup();
    const currentUser = {
      uid: 'email-user',
      email: 'user@example.com',
      providerData: [{ providerId: 'password' }],
    };
    firebaseServices.auth.currentUser = currentUser;
    authMocks.credential.mockReturnValue({ type: 'password-credential' });
    authMocks.reauthCredential.mockResolvedValue(undefined);

    await renderProvider();
    await user.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(authMocks.deleteUser).toHaveBeenCalledWith(currentUser));
    expect(authMocks.credential).toHaveBeenCalledWith('user@example.com', 'senha-atual');
    expect(authMocks.reauthCredential).toHaveBeenCalledWith(currentUser, { type: 'password-credential' });
    expect(authMocks.reauthCredential.mock.invocationCallOrder[0]).toBeLessThan(
      firestoreMocks.deleteDoc.mock.invocationCallOrder[0],
    );
  });

  it('deletes Firestore documents in batches of at most 500 writes', async () => {
    const user = userEvent.setup();
    const currentUser = {
      uid: 'large-account',
      email: 'large@example.com',
      providerData: [{ providerId: 'password' }],
    };
    const emptySnapshot = { docs: [], empty: true };
    const librarySnapshot = {
      docs: Array.from({ length: 501 }, (_, index) => ({ ref: `library/doc-${index}` })),
      empty: false,
    };
    const batches = [];

    firebaseServices.auth.currentUser = currentUser;
    authMocks.credential.mockReturnValue({ type: 'password-credential' });
    authMocks.reauthCredential.mockResolvedValue(undefined);
    firestoreMocks.getDocs
      .mockReset()
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(librarySnapshot)
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(emptySnapshot);
    firestoreMocks.writeBatch.mockImplementation(() => {
      const batch = {
        delete: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      batches.push(batch);
      return batch;
    });

    await renderProvider();
    await user.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(authMocks.deleteUser).toHaveBeenCalledWith(currentUser));
    expect(batches).toHaveLength(2);
    expect(batches.map((batch) => batch.delete.mock.calls.length)).toEqual([500, 1]);
    expect(batches.every((batch) => batch.commit.mock.calls.length === 1)).toBe(true);
  });

  it('removes external notifications and likes before deleting account-owned data', async () => {
    const user = userEvent.setup();
    const currentUser = {
      uid: 'departing-user',
      email: 'departing@example.com',
      providerData: [{ providerId: 'password' }],
    };
    const emptySnapshot = { docs: [], empty: true };
    const actorNotificationsSnapshot = {
      docs: [{ ref: 'users/target-user/notifications/created-by-departing-user' }],
      empty: false,
    };
    const likedCommentsSnapshot = {
      docs: [{ ref: 'comments/liked-by-departing-user' }],
      empty: false,
    };
    const ownCommentsSnapshot = {
      docs: [{ ref: 'comments/authored-by-departing-user' }],
      empty: false,
    };
    const batches = [];

    firebaseServices.auth.currentUser = currentUser;
    authMocks.credential.mockReturnValue({ type: 'password-credential' });
    authMocks.reauthCredential.mockResolvedValue(undefined);
    firestoreMocks.getDocs
      .mockReset()
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(actorNotificationsSnapshot)
      .mockResolvedValueOnce(likedCommentsSnapshot)
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(emptySnapshot)
      .mockResolvedValueOnce(ownCommentsSnapshot);
    firestoreMocks.writeBatch.mockImplementation(() => {
      const batch = {
        delete: vi.fn(),
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      };
      batches.push(batch);
      return batch;
    });

    await renderProvider();
    await user.click(screen.getByRole('button', { name: 'Excluir' }));

    await waitFor(() => expect(authMocks.deleteUser).toHaveBeenCalledWith(currentUser));
    expect(firestoreMocks.collectionGroup).toHaveBeenCalledWith(firebaseServices.db, 'notifications');
    expect(firestoreMocks.where).toHaveBeenCalledWith('actorUid', '==', 'departing-user');
    expect(firestoreMocks.where).toHaveBeenCalledWith('likedBy', 'array-contains', 'departing-user');
    expect(batches).toHaveLength(3);
    expect(batches[0].delete).toHaveBeenCalledWith(
      'users/target-user/notifications/created-by-departing-user',
    );
    expect(batches[1].update).toHaveBeenCalledWith(
      'comments/liked-by-departing-user',
      {
        likedBy: { operation: 'arrayRemove', value: 'departing-user' },
        likes: { operation: 'increment', value: -1 },
      },
    );
    expect(batches[2].delete).toHaveBeenCalledWith('comments/authored-by-departing-user');
    expect(batches[2].commit.mock.invocationCallOrder[0]).toBeLessThan(
      firestoreMocks.deleteDoc.mock.invocationCallOrder[0],
    );
  });
});
