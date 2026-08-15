import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function useUserProfile() {
    const { user } = useAuth();
    const userId = user?.uid || null;
    const { toast } = useToast();
    const [subscriptionVersion, setSubscriptionVersion] = useState(0);
    const [state, setState] = useState({
        uid: null,
        version: 0,
        profile: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!userId) {
            const resetTimer = setTimeout(() => {
                setState({ uid: null, version: subscriptionVersion, profile: null, loading: false, error: null });
            }, 0);
            return () => clearTimeout(resetTimer);
        }

        return onSnapshot(doc(db, 'users', userId), (snapshot) => {
            setState({
                uid: userId,
                version: subscriptionVersion,
                profile: snapshot.exists() ? snapshot.data() : null,
                loading: false,
                error: null,
            });
        }, (error) => {
            console.error('Erro ao buscar perfil:', error);
            setState((current) => ({
                uid: userId,
                version: subscriptionVersion,
                profile: current.uid === userId && current.version === subscriptionVersion
                    ? current.profile
                    : null,
                loading: false,
                error,
            }));
        });
    }, [subscriptionVersion, userId]);

    const isCurrentUser = state.uid === userId && state.version === subscriptionVersion;
    const profile = userId && isCurrentUser ? state.profile : null;
    const loading = Boolean(userId) && (!isCurrentUser || state.loading);
    const error = userId && isCurrentUser ? state.error : null;

    const retry = useCallback(() => {
        if (!userId) return;
        setSubscriptionVersion((current) => current + 1);
    }, [userId]);

    const updateProfileData = async (newData) => {
        if (!userId) return;
        try {
            const dataToSave = { ...newData };
            if (dataToSave.displayName) dataToSave.searchName = dataToSave.displayName.toLowerCase();
            await setDoc(doc(db, 'users', userId), dataToSave, { merge: true });
            toast.success('Perfil atualizado com sucesso!', 'Salvo');
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            toast.error('Erro ao salvar perfil.', 'Erro');
            throw error;
        }
    };

    return {
        profile,
        loading,
        error,
        retry,
        refetch: retry,
        updateProfileData,
    };
}
