import { useCallback, useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/services/firebase';

const DEFAULT_STATE = {
    baseKey: null,
    key: null,
    list: [],
    loading: true,
    error: null,
};

export function useFollowList(uid, type = 'followers', maxItems = 50) {
    const baseKey = uid && type ? `${uid}:${type}:${maxItems}` : null;
    const [retryToken, setRetryToken] = useState(0);
    const subscriptionKey = baseKey ? `${baseKey}:${retryToken}` : null;
    const [state, setState] = useState(DEFAULT_STATE);

    useEffect(() => {
        if (!subscriptionKey) return undefined;

        const listRef = collection(db, 'users', uid, type);
        const listQuery = query(listRef, orderBy('followedAt', 'desc'), limit(maxItems));

        return onSnapshot(listQuery, (snapshot) => {
            setState({
                baseKey,
                key: subscriptionKey,
                list: snapshot.docs.map((item) => ({ uid: item.id, ...item.data() })),
                loading: false,
                error: null,
            });
        }, (error) => {
            console.error(`[useFollowList] ${type} error:`, error);
            setState({
                baseKey,
                key: subscriptionKey,
                list: [],
                loading: false,
                error,
            });
        });
    }, [baseKey, maxItems, subscriptionKey, type, uid]);

    const retry = useCallback(() => {
        if (!baseKey) return;
        setRetryToken((current) => current + 1);
    }, [baseKey]);

    const isCurrentSubscription = state.key === subscriptionKey;
    return {
        list: subscriptionKey && isCurrentSubscription ? state.list : [],
        loading: Boolean(subscriptionKey) && (!isCurrentSubscription || state.loading),
        error: subscriptionKey && isCurrentSubscription ? state.error : null,
        retry,
        refetch: retry,
    };
}
