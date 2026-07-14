import { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { auth, googleProvider, db } from '@/services/firebase';
import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    reauthenticateWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';

const AuthContext = createContext();
const FOLLOW_RELATION_BATCH_SIZE = 5;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Login com Google
    const signInGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Verificar se é o primeiro login e criar documento no Firestore
            const userRef = doc(db, 'users', user.uid);
            const snapshot = await getDoc(userRef);

            if (!snapshot.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    displayName: user.displayName,
                    searchName: user.displayName?.toLowerCase() || '',
                    // email: user.email, // REMOVIDO por segurança (será lido via auth.currentUser)
                    photoURL: user.photoURL,
                    bannerURL: null,
                    hasCompletedOnboarding: false,
                    createdAt: serverTimestamp(),
                    stats: {
                        watchedAnimes: 0,
                        episodesWatched: 0,
                        meanScore: 0
                    }
                });
            }
        } catch (error) {
            console.error("Erro no login Google:", error);
            toast.error(`Erro ao fazer login: ${error.message}`);
            throw error;
        }
    };

    // Logout
    const signOut = () => {
        return firebaseSignOut(auth);
    };

    // ── Helper: limpa todos os dados do usuário no Firestore ──────────────────
    const cleanupUserData = async (uid) => {
        // Each pair uses getAfter() in Firestore Rules, so keep batches below rule access limits.
        const [followingSnap, followersSnap] = await Promise.all([
            getDocs(collection(db, 'users', uid, 'following')),
            getDocs(collection(db, 'users', uid, 'followers')),
        ]);
        const followRelations = [
            ...followingSnap.docs.map((relation) => ({ followerUid: uid, targetUid: relation.id })),
            ...followersSnap.docs.map((relation) => ({ followerUid: relation.id, targetUid: uid })),
        ];

        for (let index = 0; index < followRelations.length; index += FOLLOW_RELATION_BATCH_SIZE) {
            const batch = writeBatch(db);
            followRelations.slice(index, index + FOLLOW_RELATION_BATCH_SIZE).forEach(({ followerUid, targetUid }) => {
                batch.delete(doc(db, 'users', followerUid, 'following', targetUid));
                batch.delete(doc(db, 'users', targetUid, 'followers', followerUid));
            });
            await batch.commit();
        }
        // 1. Limpar sub-coleções e dados órfãos
        const subCollections = ['library', 'favorite_characters', 'followed_studios', 'notifications'];
        for (const subcol of subCollections) {
            const snap = await getDocs(collection(db, 'users', uid, subcol));
            if (!snap.empty) {
                const batch = writeBatch(db);
                snap.docs.forEach(d => batch.delete(d.ref));
                await batch.commit();
            }
        }

        // 2. Limpar comentários do usuário na coleção raiz
        const commentsSnap = await getDocs(query(collection(db, 'comments'), where('userId', '==', uid)));
        if (!commentsSnap.empty) {
            const batch = writeBatch(db);
            commentsSnap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }

        // 3. Deletar documento principal do usuário
        await deleteDoc(doc(db, 'users', uid));
    };

    // Deletar Conta (com limpeza de sub-coleções)
    const deleteAccount = async () => {
        if (!auth.currentUser) return;

        const uid = auth.currentUser.uid;

        try {
            // Limpar dados no Firestore antes de deletar o Auth account
            await cleanupUserData(uid);

            // Deletar usuário da Autenticação
            await auth.currentUser.delete();

        } catch (error) {
            // Se o login é antigo, Firebase exige re-autenticação
            if (error.code === 'auth/requires-recent-login') {
                try {
                    toast.info("Por segurança, confirme sua identidade novamente.", "Re-autenticação");
                    await reauthenticateWithPopup(auth.currentUser, googleProvider);

                    // ✅ Limpar Firestore ANTES de deletar — sem dados órfãos
                    await cleanupUserData(uid);
                    await auth.currentUser.delete();
                    return;
                } catch (reAuthError) {
                    console.error("Erro na re-autenticação:", reAuthError);
                    toast.error("Falha na re-autenticação. Tente fazer login novamente.", "Erro");
                    throw reAuthError;
                }
            }
            console.error("Erro ao deletar conta:", error);
            throw error;
        }
    };

    // Monitorar Estado
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = {
        user,
        signInGoogle,
        signOut,
        deleteAccount,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// The hook shares the private context with its provider in this module.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    return useContext(AuthContext);
};
