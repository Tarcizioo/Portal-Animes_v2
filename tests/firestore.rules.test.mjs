import { after, afterEach, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

const PROJECT_ID = 'portal-animes-rules-test';
let testEnvironment;

const followSnapshot = (displayName) => ({
  displayName,
  photoURL: null,
  followedAt: serverTimestamp(),
});

const studioFavorite = (id = 'anilist-studio-21') => ({
  id,
  mal_id: id,
  name: 'Studio Ghibli',
  image: null,
  addedAt: serverTimestamp(),
});
async function seedFollowPair(followerUid, targetUid) {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', followerUid, 'following', targetUid), {
      displayName: targetUid,
      photoURL: null,
      followedAt: new Date(),
    });
    await setDoc(doc(db, 'users', targetUid, 'followers', followerUid), {
      displayName: followerUid,
      photoURL: null,
      followedAt: new Date(),
    });
  });
}

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});

afterEach(async () => {
  await testEnvironment.clearFirestore();
});

after(async () => {
  await testEnvironment.cleanup();
});

test('rejects a follow write that creates only one side of the relationship', async () => {
  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();

  await assertFails(
    setDoc(
      doc(aliceDb, 'users', 'alice', 'following', 'bob'),
      followSnapshot('Bob'),
    ),
  );
});

test('allows a follow when both sides are written in one batch', async () => {
  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();
  const batch = writeBatch(aliceDb);

  batch.set(
    doc(aliceDb, 'users', 'alice', 'following', 'bob'),
    followSnapshot('Bob'),
  );
  batch.set(
    doc(aliceDb, 'users', 'bob', 'followers', 'alice'),
    followSnapshot('Alice'),
  );

  await assertSucceeds(batch.commit());
});

test('rejects an unfollow that would leave the mirrored follower document behind', async () => {
  await seedFollowPair('alice', 'bob');
  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();

  await assertFails(deleteDoc(doc(aliceDb, 'users', 'alice', 'following', 'bob')));
});

test('allows the profile owner to remove a follower by deleting both sides', async () => {
  await seedFollowPair('alice', 'bob');
  const bobDb = testEnvironment.authenticatedContext('bob').firestore();
  const batch = writeBatch(bobDb);

  batch.delete(doc(bobDb, 'users', 'alice', 'following', 'bob'));
  batch.delete(doc(bobDb, 'users', 'bob', 'followers', 'alice'));

  await assertSucceeds(batch.commit());
});

test('allows the owner to save and remove a favorite studio', async () => {
  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();
  const studioRef = doc(aliceDb, 'users', 'alice', 'followed_studios', 'anilist-studio-21');

  await assertSucceeds(setDoc(studioRef, studioFavorite()));
  await assertSucceeds(deleteDoc(studioRef));
});

test('rejects writing a favorite studio in another user profile', async () => {
  const bobDb = testEnvironment.authenticatedContext('bob').firestore();

  await assertFails(
    setDoc(
      doc(bobDb, 'users', 'alice', 'followed_studios', 'anilist-studio-21'),
      studioFavorite(),
    ),
  );
});

test('rejects external links and unexpected fields in favorite studios', async () => {
  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();

  await assertFails(
    setDoc(
      doc(aliceDb, 'users', 'alice', 'followed_studios', 'anilist-studio-21'),
      { ...studioFavorite(), url: 'https://example.com/external-profile' },
    ),
  );
});
