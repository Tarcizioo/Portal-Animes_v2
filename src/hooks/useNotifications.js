import { useEffect, useState } from 'react';
import {
    collection, deleteDoc, doc, getDoc, limit, onSnapshot,
    orderBy, query, updateDoc, writeBatch,
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/services/firebase';

async function hydrateActorProfiles(notifications) {
    const actorIds = [...new Set(notifications.map((item) => item.actorUid).filter(Boolean))];
    if (actorIds.length === 0) return notifications;

    const profileSnapshots = await Promise.allSettled(actorIds.map((actorUid) => (
        getDoc(doc(db, 'users', actorUid))
    )));
    const profileEntries = profileSnapshots.flatMap((result) => {
        if (result.status !== 'fulfilled' || !result.value.exists()) return [];
        return [[result.value.id, result.value.data()]];
    });

    const profiles = new Map(profileEntries);
    return notifications.map((notification) => {
        const liveProfile = profiles.get(notification.actorUid);
        if (!liveProfile) return notification;

        return {
            ...notification,
            actorName: liveProfile.displayName || notification.actorName,
            actorAvatar: liveProfile.photoURL || null,
        };
    });
}

export function useNotifications() {
    const { user } = useAuth();
    const userId = user?.uid || null;
    const [state, setState] = useState({ uid: null, notifications: [], loading: true });

    useEffect(() => {
        if (!userId) return undefined;

        const notificationsRef = collection(db, 'users', userId, 'notifications');
        const notificationsQuery = query(notificationsRef, orderBy('createdAt', 'desc'), limit(20));
        let snapshotVersion = 0;

        const unsubscribe = onSnapshot(notificationsQuery, async (snapshot) => {
            const currentVersion = ++snapshotVersion;
            const storedNotifications = snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data(),
                createdAt: item.data().createdAt?.toDate() || new Date(),
            }));

            try {
                const notifications = await hydrateActorProfiles(storedNotifications);
                if (currentVersion === snapshotVersion) {
                    setState({ uid: userId, notifications, loading: false });
                }
            } catch (error) {
                console.warn('[useNotifications] Could not refresh actor profiles:', error);
                if (currentVersion === snapshotVersion) {
                    setState({ uid: userId, notifications: storedNotifications, loading: false });
                }
            }
        }, (error) => {
            console.error('Error fetching notifications:', error);
            setState({ uid: userId, notifications: [], loading: false });
        });

        return () => {
            snapshotVersion += 1;
            unsubscribe();
        };
    }, [userId]);

    const isCurrentUser = state.uid === userId;
    const notifications = userId && isCurrentUser ? state.notifications : [];
    const loading = Boolean(userId) && (!isCurrentUser || state.loading);
    const unreadCount = notifications.filter((notification) => !notification.read).length;

    const markAsRead = async (notificationId) => {
        if (!userId) return;
        try {
            await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { read: true });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        const unread = notifications.filter((notification) => !notification.read);
        if (!userId || unread.length === 0) return;
        try {
            const batch = writeBatch(db);
            unread.forEach((notification) => batch.update(doc(db, 'users', userId, 'notifications', notification.id), { read: true }));
            await batch.commit();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        if (!userId) return;
        try {
            await deleteDoc(doc(db, 'users', userId, 'notifications', notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const deleteAllRead = async () => {
        const readNotifications = notifications.filter((notification) => notification.read);
        if (!userId || readNotifications.length === 0) return;
        try {
            const batch = writeBatch(db);
            readNotifications.forEach((notification) => batch.delete(doc(db, 'users', userId, 'notifications', notification.id)));
            await batch.commit();
        } catch (error) {
            console.error('Error deleting read notifications:', error);
        }
    };

    return { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, deleteAllRead };
}