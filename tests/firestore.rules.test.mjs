import assert from 'node:assert/strict';
import { after, afterEach, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  arrayRemove,
  collection,
  collectionGroup,
  getDoc,
  getDocs,
  increment,
  query,
  where,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
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

test('allows an owner profile without private authentication fields', async () => {
  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();

  await assertSucceeds(
    setDoc(
      doc(aliceDb, 'users', 'alice'),
      { displayName: 'Alice', searchName: 'alice' },
    ),
  );
});

test('allows valid optional onboarding metadata on profile creation', async () => {
  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();

  await assertSucceeds(setDoc(doc(aliceDb, 'users', 'alice'), {
    displayName: 'Alice',
    isPublic: false,
    onboardingVersion: 2,
    onboardingStep: 'identity',
    onboardingUpdatedAt: serverTimestamp(),
    onboardingCompletedAt: serverTimestamp(),
  }));
});

test('rejects invalid onboarding metadata and privacy values on profile creation', async () => {
  const invalidVersionDb = testEnvironment.authenticatedContext('invalid-version').firestore();
  const invalidStepDb = testEnvironment.authenticatedContext('invalid-step').firestore();
  const invalidPrivacyDb = testEnvironment.authenticatedContext('invalid-privacy').firestore();
  const invalidTimestampDb = testEnvironment.authenticatedContext('invalid-timestamp').firestore();

  await assertFails(setDoc(doc(invalidVersionDb, 'users', 'invalid-version'), {
    onboardingVersion: 3,
  }));
  await assertFails(setDoc(doc(invalidStepDb, 'users', 'invalid-step'), {
    onboardingStep: 'welcome',
  }));
  await assertFails(setDoc(doc(invalidPrivacyDb, 'users', 'invalid-privacy'), {
    isPublic: 'yes',
  }));
  await assertFails(setDoc(doc(invalidTimestampDb, 'users', 'invalid-timestamp'), {
    onboardingUpdatedAt: new Date('2026-08-11T12:00:00.000Z'),
  }));
});

test('validates only onboarding fields changed by a profile update', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', 'legacy-onboarding'), {
      displayName: 'Legacy Onboarding',
      searchName: 'legacy onboarding',
      isPublic: 'legacy-value',
      onboardingVersion: 0,
      onboardingStep: 'welcome',
      onboardingUpdatedAt: 'legacy-timestamp',
      onboardingCompletedAt: 'legacy-timestamp',
    });
  });

  const ownerDb = testEnvironment.authenticatedContext('legacy-onboarding').firestore();
  const profileRef = doc(ownerDb, 'users', 'legacy-onboarding');

  await assertSucceeds(updateDoc(profileRef, {
    displayName: 'Repaired legacy profile',
  }));

  await assertFails(updateDoc(profileRef, { isPublic: 'still-not-a-boolean' }));
  await assertFails(updateDoc(profileRef, { onboardingVersion: 0.5 }));
  await assertFails(updateDoc(profileRef, { onboardingStep: 'done' }));
  await assertFails(updateDoc(profileRef, { onboardingUpdatedAt: new Date() }));
  await assertFails(updateDoc(profileRef, { onboardingCompletedAt: new Date() }));
});

test('allows valid onboarding progress and completion fields on profile update', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', 'alice'), {
      displayName: 'Alice',
      isPublic: true,
    });
  });

  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();
  const profileRef = doc(aliceDb, 'users', 'alice');

  await assertSucceeds(updateDoc(profileRef, {
    isPublic: false,
    onboardingVersion: 2,
    onboardingStep: 'favorite',
    onboardingUpdatedAt: serverTimestamp(),
  }));
  await assertSucceeds(updateDoc(profileRef, {
    onboardingStep: 'complete',
    onboardingUpdatedAt: serverTimestamp(),
    onboardingCompletedAt: serverTimestamp(),
  }));
});

test('treats a legacy profile without isPublic as private by default', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', 'legacy-user'), {
      displayName: 'Legacy User',
      searchName: 'legacy user',
    });
  });

  const legacyOwnerDb = testEnvironment.authenticatedContext('legacy-user').firestore();
  const otherUserDb = testEnvironment.authenticatedContext('alice').firestore();
  const profilePath = ['users', 'legacy-user'];

  await assertSucceeds(getDoc(doc(legacyOwnerDb, ...profilePath)));
  await assertFails(getDoc(doc(otherUserDb, ...profilePath)));
});

test('keeps a private social graph hidden from third parties but readable by its owner', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', 'alice'), {
      displayName: 'Alice',
      searchName: 'alice',
      isPublic: false,
    });
    await setDoc(doc(db, 'users', 'alice', 'following', 'bob'), {
      displayName: 'Bob',
      photoURL: null,
      followedAt: new Date(),
    });
    await setDoc(doc(db, 'users', 'alice', 'followers', 'carol'), {
      displayName: 'Carol',
      photoURL: null,
      followedAt: new Date(),
    });
  });

  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();
  const malloryDb = testEnvironment.authenticatedContext('mallory').firestore();
  const followingPath = ['users', 'alice', 'following', 'bob'];
  const followerPath = ['users', 'alice', 'followers', 'carol'];

  await assertSucceeds(getDoc(doc(aliceDb, ...followingPath)));
  await assertSucceeds(getDoc(doc(aliceDb, ...followerPath)));
  await assertFails(getDoc(doc(malloryDb, ...followingPath)));
  await assertFails(getDoc(doc(malloryDb, ...followerPath)));
});

test('rejects authentication credentials in a public profile document', async () => {
  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();

  await assertFails(
    setDoc(
      doc(aliceDb, 'users', 'alice'),
      { displayName: 'Alice', email: 'alice@example.com', password: 'never-store-this' },
    ),
  );
});

test('allows owners to delete library and favorite-character documents', async () => {
  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();
  const libraryRef = doc(aliceDb, 'users', 'alice', 'library', '1');
  const characterRef = doc(aliceDb, 'users', 'alice', 'favorite_characters', '10');

  await assertSucceeds(setDoc(libraryRef, {
    id: '1',
    title: 'Cowboy Bebop',
    score: 8,
    status: 'watching',
    currentEp: 3,
  }));
  await assertSucceeds(setDoc(characterRef, {
    id: '10',
    name: 'Spike Spiegel',
  }));

  await assertSucceeds(deleteDoc(libraryRef));
  await assertSucceeds(deleteDoc(characterRef));
});

test('rejects deleting another user library and favorite-character documents', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', 'alice', 'library', '1'), {
      id: '1',
      title: 'Cowboy Bebop',
      score: 8,
      status: 'watching',
      currentEp: 3,
    });
    await setDoc(doc(db, 'users', 'alice', 'favorite_characters', '10'), {
      id: '10',
      name: 'Spike Spiegel',
    });
  });
  const bobDb = testEnvironment.authenticatedContext('bob').firestore();

  await assertFails(deleteDoc(doc(bobDb, 'users', 'alice', 'library', '1')));
  await assertFails(deleteDoc(doc(bobDb, 'users', 'alice', 'favorite_characters', '10')));
});

test('allows an atomic progress timestamp and activity-log update', async () => {
  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();
  const userRef = doc(aliceDb, 'users', 'alice');
  const libraryRef = doc(aliceDb, 'users', 'alice', 'library', '1');

  await assertSucceeds(setDoc(userRef, {
    displayName: 'Alice',
    searchName: 'alice',
    isPublic: true,
    activityLog: {},
  }));
  await assertSucceeds(setDoc(libraryRef, {
    id: '1',
    title: 'Cowboy Bebop',
    score: 8,
    status: 'watching',
    currentEp: 1,
  }));

  const batch = writeBatch(aliceDb);
  batch.update(libraryRef, {
    currentEp: 2,
    lastProgressAt: serverTimestamp(),
  });
  batch.update(userRef, {
    'activityLog.2026-08-09': increment(1),
  });

  await assertSucceeds(batch.commit());
});

test('lists only profiles selected by an explicit public-profile query', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', 'public-user'), {
      displayName: 'Public User',
      searchName: 'public user',
      isPublic: true,
    });
    await setDoc(doc(db, 'users', 'private-user'), {
      displayName: 'Private User',
      searchName: 'private user',
      isPublic: false,
    });
  });
  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();
  const usersRef = collection(aliceDb, 'users');
  const publicUsersQuery = query(usersRef, where('isPublic', '==', true));

  const publicUsers = await assertSucceeds(getDocs(publicUsersQuery));
  const publicProfile = await assertSucceeds(getDoc(doc(aliceDb, 'users', 'public-user')));
  await assertFails(getDoc(doc(aliceDb, 'users', 'private-user')));
  await assertFails(getDocs(usersRef));

  assert.deepEqual(publicUsers.docs.map((profileDoc) => profileDoc.id), ['public-user']);
  assert.equal(publicProfile.id, 'public-user');
});

test('allows an actor to list and delete only notifications they created', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', 'target-one', 'notifications', 'from-alice'), {
      actorUid: 'alice',
      type: 'profile_view',
    });
    await setDoc(doc(db, 'users', 'target-two', 'notifications', 'from-bob'), {
      actorUid: 'bob',
      type: 'profile_view',
    });
  });

  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();
  const actorQuery = query(
    collectionGroup(aliceDb, 'notifications'),
    where('actorUid', '==', 'alice'),
  );
  const otherActorQuery = query(
    collectionGroup(aliceDb, 'notifications'),
    where('actorUid', '==', 'bob'),
  );

  const actorNotifications = await assertSucceeds(getDocs(actorQuery));
  await assertFails(getDocs(collectionGroup(aliceDb, 'notifications')));
  await assertFails(getDocs(otherActorQuery));
  await assertSucceeds(
    deleteDoc(doc(aliceDb, 'users', 'target-one', 'notifications', 'from-alice')),
  );
  await assertFails(
    deleteDoc(doc(aliceDb, 'users', 'target-two', 'notifications', 'from-bob')),
  );

  assert.deepEqual(actorNotifications.docs.map((notification) => notification.id), ['from-alice']);
});

test('allows account cleanup to remove only the caller uid from comment likes', async () => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'comments', 'liked-comment'), {
      animeId: '1',
      userId: 'author',
      userName: 'Author',
      userAvatar: null,
      content: 'Great episode',
      createdAt: new Date(),
      likes: 2,
      likedBy: ['alice', 'bob'],
    });
  });

  const aliceDb = testEnvironment.authenticatedContext('alice').firestore();
  const malloryDb = testEnvironment.authenticatedContext('mallory').firestore();
  const commentRef = doc(aliceDb, 'comments', 'liked-comment');

  await assertSucceeds(updateDoc(commentRef, {
    likedBy: arrayRemove('alice'),
    likes: increment(-1),
  }));
  await assertFails(updateDoc(doc(malloryDb, 'comments', 'liked-comment'), {
    likedBy: arrayRemove('bob'),
    likes: increment(-1),
  }));
});
