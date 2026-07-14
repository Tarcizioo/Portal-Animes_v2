import { useEffect, useRef } from 'react';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// 5 minutes in milliseconds
const PING_INTERVAL_MS = 5 * 60 * 1000;

export function usePresence() {
    const { user } = useAuth();
    const userId = user?.uid || null;
    const isOnlineRef = useRef(false);

    useEffect(() => {
        if (!userId) return undefined;

        const userRef = doc(db, 'users', userId);

        const setOnlineStatus = async (isOnline) => {
            try {
                // Prevent unnecessary duplicate writes
                if (isOnlineRef.current === isOnline && isOnline) {
                    // We only skip if we are already online and trying to set online AGAIN
                    // unless it's a heartbeat (handled by setInterval)
                    return; 
                }

                await updateDoc(userRef, {
                    isOnline: isOnline,
                    lastActive: serverTimestamp()
                });
                isOnlineRef.current = isOnline;
            } catch (error) {
                console.error("Erro ao atualizar status online:", error);
            }
        };

        const heartbeat = async () => {
             try {
                // Heartbeat always updates the timestamp to keep it fresh
                await updateDoc(userRef, {
                    isOnline: true,
                    lastActive: serverTimestamp()
                });
                isOnlineRef.current = true;
            } catch (error) {
                console.error("Erro no heartbeat online:", error);
            }
        };

        // 1. Mark as online immediately on mount
        setOnlineStatus(true);

        // 2. Setup periodic heartbeat
        const intervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                heartbeat();
            }
        }, PING_INTERVAL_MS);

        // 3. Handle visibility changes (tab switching, minimizing on mobile)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                setOnlineStatus(true);
            } else {
                setOnlineStatus(false);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // 4. Handle window close/refresh (best effort)
        const handleBeforeUnload = () => {
            // Need a synchronous-like beacon or just normal update (may fail if closed too fast)
            setOnlineStatus(false);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup
        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            setOnlineStatus(false);
        };
    }, [userId]);
}
