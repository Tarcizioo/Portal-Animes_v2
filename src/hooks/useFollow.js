import { useState, useEffect, useCallback } from 'react';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { notifyNewFollower } from '@/services/notificationService';
import {
    doc, getDoc, onSnapshot,
    writeBatch, serverTimestamp,
} from 'firebase/firestore';

/**
 * Manages the mirrored follow relationship between the current user and targetUid.
 * Both documents are always written in one batch and enforced by Firestore Rules.
 */
export function useFollow(targetUid) {
    const { user } = useAuth();
    const currentUid = user?.uid ?? null;
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mutating, setMutating] = useState(false);

    useEffect(() => {
        if (!currentUid || !targetUid || currentUid === targetUid) {
            setIsFollowing(false);
            setLoading(false);
            return;
        }

        setIsFollowing(false);
        setLoading(true);
        const followRef = doc(db, 'users', currentUid, 'following', targetUid);
        const unsubscribe = onSnapshot(
            followRef,
            (snapshot) => {
                setIsFollowing(snapshot.exists());
                setLoading(false);
            },
            () => setLoading(false),
        );

        return () => unsubscribe();
    }, [currentUid, targetUid]);

    const follow = useCallback(async (targetProfile) => {
        if (!user || !targetUid || mutating) return false;

        setMutating(true);
        try {
            const mySnapshot = await getDoc(doc(db, 'users', user.uid));
            const myData = mySnapshot.data() || {};
            const myProfile = {
                displayName: myData.displayName || user.displayName || 'Usuário',
                photoURL: myData.photoURL || user.photoURL || null,
            };
            const followedAt = serverTimestamp();
            const batch = writeBatch(db);

            batch.set(doc(db, 'users', user.uid, 'following', targetUid), {
                displayName: targetProfile?.displayName || 'Usuário',
                photoURL: targetProfile?.photoURL || null,
                followedAt,
            });
            batch.set(doc(db, 'users', targetUid, 'followers', user.uid), {
                ...myProfile,
                followedAt,
            });

            await batch.commit();
            notifyNewFollower(targetUid, myProfile, user.uid).catch(() => {});
            return true;
        } catch (error) {
            console.error('[useFollow] follow error:', error);
            throw error;
        } finally {
            setMutating(false);
        }
    }, [user, targetUid, mutating]);

    const unfollow = useCallback(async () => {
        if (!user || !targetUid || mutating) return false;

        setMutating(true);
        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'users', user.uid, 'following', targetUid));
            batch.delete(doc(db, 'users', targetUid, 'followers', user.uid));

            await batch.commit();
            return true;
        } catch (error) {
            console.error('[useFollow] unfollow error:', error);
            throw error;
        } finally {
            setMutating(false);
        }
    }, [user, targetUid, mutating]);

    return { isFollowing, loading, mutating, follow, unfollow };
}