import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';

const DEFAULT_COUNTS = {
  followersCount: 0,
  followingCount: 0,
};

const DEFAULT_STATE = {
  uid: null,
  followersCount: 0,
  followingCount: 0,
  followersReady: false,
  followingReady: false,
};

export function useFollowCounts(uid) {
  const [state, setState] = useState(DEFAULT_STATE);

  useEffect(() => {
    if (!uid) return undefined;

    const updateState = (partial) => {
      setState((prev) => {
        const baseState = prev.uid === uid
          ? prev
          : {
              uid,
              followersCount: 0,
              followingCount: 0,
              followersReady: false,
              followingReady: false,
            };

        return {
          ...baseState,
          ...partial,
          uid,
        };
      });
    };

    const unsubscribeFollowers = onSnapshot(
      collection(db, 'users', uid, 'followers'),
      (snapshot) => {
        updateState({
          followersCount: snapshot.size,
          followersReady: true,
        });
      },
      () => {
        updateState({ followersReady: true });
      },
    );

    const unsubscribeFollowing = onSnapshot(
      collection(db, 'users', uid, 'following'),
      (snapshot) => {
        updateState({
          followingCount: snapshot.size,
          followingReady: true,
        });
      },
      () => {
        updateState({ followingReady: true });
      },
    );

    return () => {
      unsubscribeFollowers();
      unsubscribeFollowing();
    };
  }, [uid]);

  if (!uid || state.uid !== uid) {
    return {
      ...DEFAULT_COUNTS,
      loading: true,
    };
  }

  return {
    followersCount: state.followersCount,
    followingCount: state.followingCount,
    loading: !(state.followersReady && state.followingReady),
  };
}
