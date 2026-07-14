import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function useUserProfile() {
    const { user } = useAuth();
    const userId = user?.uid || null;
    const { toast } = useToast();
    const [state, setState] = useState({ uid: null, profile: null, loading: true });

    useEffect(() => {
        if (!userId) return undefined;

        return onSnapshot(doc(db, 'users', userId), (snapshot) => {
            setState({ uid: userId, profile: snapshot.exists() ? snapshot.data() : null, loading: false });
        }, (error) => {
            console.error('Erro ao buscar perfil:', error);
            setState({ uid: userId, profile: null, loading: false });
        });
    }, [userId]);

    const isCurrentUser = state.uid === userId;
    const profile = userId && isCurrentUser ? state.profile : null;
    const loading = Boolean(userId) && (!isCurrentUser || state.loading);

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

    return { profile, loading, updateProfileData };
}