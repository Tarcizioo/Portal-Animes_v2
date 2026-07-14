import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';

export const DEFAULT_NOTIFICATION_PREFS = {
    profile_view: true,
    comment_like: true,
    new_follower: true,
};

export function useNotificationPrefs() {
    const { user } = useAuth();
    const userId = user?.uid || null;
    const [state, setState] = useState({ uid: null, prefs: DEFAULT_NOTIFICATION_PREFS, loading: true });

    useEffect(() => {
        if (!userId) return undefined;

        const userRef = doc(db, 'users', userId);
        return onSnapshot(userRef, (snapshot) => {
            const savedPrefs = snapshot.exists() ? snapshot.data()?.notificationPrefs : null;
            setState({
                uid: userId,
                prefs: { ...DEFAULT_NOTIFICATION_PREFS, ...savedPrefs },
                loading: false,
            });
        }, (error) => {
            console.error('[useNotificationPrefs] snapshot error:', error);
            setState({ uid: userId, prefs: DEFAULT_NOTIFICATION_PREFS, loading: false });
        });
    }, [userId]);

    const isCurrentUser = state.uid === userId;
    const prefs = userId && isCurrentUser ? state.prefs : DEFAULT_NOTIFICATION_PREFS;
    const loading = Boolean(userId) && (!isCurrentUser || state.loading);

    const updatePrefs = useCallback(async (changes) => {
        if (!userId) return;
        try {
            await setDoc(doc(db, 'users', userId), {
                notificationPrefs: { ...prefs, ...changes },
            }, { merge: true });
        } catch (error) {
            console.error('[useNotificationPrefs] update error:', error);
        }
    }, [userId, prefs]);

    const updatePref = useCallback((type, value) => updatePrefs({ [type]: value }), [updatePrefs]);

    return { prefs, loading, updatePref, updatePrefs };
}