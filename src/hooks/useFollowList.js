import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/services/firebase';

export function useFollowList(uid, type = 'followers', maxItems = 50) {
    const subscriptionKey = uid && type ? `${uid}:${type}:${maxItems}` : null;
    const [state, setState] = useState({ key: null, list: [], loading: true });

    useEffect(() => {
        if (!subscriptionKey) return undefined;

        const listRef = collection(db, 'users', uid, type);
        const listQuery = query(listRef, orderBy('followedAt', 'desc'), limit(maxItems));

        return onSnapshot(listQuery, (snapshot) => {
            setState({
                key: subscriptionKey,
                list: snapshot.docs.map((item) => ({ uid: item.id, ...item.data() })),
                loading: false,
            });
        }, (error) => {
            console.error(`[useFollowList] ${type} error:`, error);
            setState({ key: subscriptionKey, list: [], loading: false });
        });
    }, [subscriptionKey, uid, type, maxItems]);

    const isCurrentSubscription = state.key === subscriptionKey;
    return {
        list: subscriptionKey && isCurrentSubscription ? state.list : [],
        loading: Boolean(subscriptionKey) && (!isCurrentSubscription || state.loading),
    };
}