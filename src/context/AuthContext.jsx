import { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { auth, googleProvider, db } from '@/services/firebase';
import { PRODUCT_EVENTS, trackProductEvent } from '@/services/productAnalytics';
import {
    createUserWithEmailAndPassword,
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential,
    signInWithPopup,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    reauthenticateWithPopup,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile
} from 'firebase/auth';
import {
    arrayRemove,
    collection,
    collectionGroup,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    increment,
    query,
    serverTimestamp,
    setDoc,
    where,
    writeBatch
} from 'firebase/firestore';

const AuthContext = createContext();
const FOLLOW_RELATION_BATCH_SIZE = 5;
const FIRESTORE_WRITE_BATCH_SIZE = 500;

async function deleteDocumentsInBatches(documentRefs) {
    for (let index = 0; index < documentRefs.length; index += FIRESTORE_WRITE_BATCH_SIZE) {
        const batch = writeBatch(db);
        documentRefs
            .slice(index, index + FIRESTORE_WRITE_BATCH_SIZE)
            .forEach((documentRef) => batch.delete(documentRef));
        await batch.commit();
    }
}

async function removeUserLikesInBatches(commentDocuments, uid) {
    for (let index = 0; index < commentDocuments.length; index += FIRESTORE_WRITE_BATCH_SIZE) {
        const batch = writeBatch(db);
        commentDocuments
            .slice(index, index + FIRESTORE_WRITE_BATCH_SIZE)
            .forEach((commentDocument) => {
                batch.update(commentDocument.ref, {
                    likedBy: arrayRemove(uid),
                    likes: increment(-1)
                });
            });
        await batch.commit();
    }
}

async function ensureUserDocument(authUser, displayNameOverride) {
    const userRef = doc(db, 'users', authUser.uid);
    const snapshot = await getDoc(userRef);
    const displayName = displayNameOverride?.trim() || authUser.displayName?.trim() || 'Usuário';
    const defaultStats = {
        watchedAnimes: 0,
        episodesWatched: 0,
        meanScore: 0
    };
    const profileDefaults = {
        uid: authUser.uid,
        displayName,
        searchName: displayName.toLocaleLowerCase('pt-BR'),
        photoURL: authUser.photoURL || null,
        bannerURL: null,
        hasCompletedOnboarding: false,
        isPublic: false,
        createdAt: serverTimestamp(),
        stats: defaultStats
    };

    if (!snapshot.exists()) {
        await setDoc(userRef, profileDefaults);
        return;
    }

    const currentProfile = snapshot.data();
    const repairs = {};

    if (!currentProfile.uid) repairs.uid = authUser.uid;
    if (displayNameOverride?.trim() && currentProfile.displayName !== displayName) {
        repairs.displayName = displayName;
        repairs.searchName = displayName.toLocaleLowerCase('pt-BR');
    } else if (!currentProfile.displayName) {
        repairs.displayName = displayName;
    }
    if (!repairs.searchName && !currentProfile.searchName) {
        repairs.searchName = (currentProfile.displayName || displayName).toLocaleLowerCase('pt-BR');
    }
    if (!Object.prototype.hasOwnProperty.call(currentProfile, 'photoURL')) {
        repairs.photoURL = authUser.photoURL || null;
    }
    if (!Object.prototype.hasOwnProperty.call(currentProfile, 'bannerURL')) {
        repairs.bannerURL = null;
    }
    if (typeof currentProfile.isPublic !== 'boolean') {
        repairs.isPublic = false;
    }
    if (typeof currentProfile.hasCompletedOnboarding !== 'boolean') {
        // Perfis criados antes do onboarding dedicado nunca receberam este campo.
        // Novos cadastros continuam sendo criados explicitamente com `false` acima.
        repairs.hasCompletedOnboarding = true;
    }
    if (!currentProfile.createdAt) repairs.createdAt = serverTimestamp();
    if (!currentProfile.stats || typeof currentProfile.stats !== 'object') {
        repairs.stats = defaultStats;
    } else if (['watchedAnimes', 'episodesWatched', 'meanScore'].some((key) => typeof currentProfile.stats[key] !== 'number')) {
        repairs.stats = {
            ...currentProfile.stats,
            watchedAnimes: typeof currentProfile.stats.watchedAnimes === 'number' ? currentProfile.stats.watchedAnimes : 0,
            episodesWatched: typeof currentProfile.stats.episodesWatched === 'number' ? currentProfile.stats.episodesWatched : 0,
            meanScore: typeof currentProfile.stats.meanScore === 'number' ? currentProfile.stats.meanScore : 0
        };
    }

    if (Object.keys(repairs).length > 0) {
        await setDoc(userRef, repairs, { merge: true });
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Login com Google
    const signInGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await ensureUserDocument(result.user);
            void trackProductEvent(PRODUCT_EVENTS.LOGIN, { method: 'google' });
            setUser(result.user);
            return result.user;
        } catch (error) {
            console.error("Erro no login Google:", error);
            throw error;
        }
    };

    const signInEmail = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        await ensureUserDocument(result.user);
        void trackProductEvent(PRODUCT_EVENTS.LOGIN, { method: 'email' });
        setUser(result.user);
        return result.user;
    };

    const signUpEmail = async ({ displayName, email, password }) => {
        const normalizedName = displayName.trim();
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(result.user, { displayName: normalizedName });
        await ensureUserDocument(result.user, normalizedName);
        void trackProductEvent(PRODUCT_EVENTS.SIGN_UP, { method: 'email' });

        let verificationSent = false;
        try {
            await sendEmailVerification(result.user);
            verificationSent = true;
            toast.info('Enviamos um link de verificação para o seu e-mail.', 'Conta criada');
        } catch (verificationError) {
            console.warn('N\u00e3o foi poss\u00edvel enviar a verifica\u00e7\u00e3o de e-mail:', verificationError);
        }

        setUser(result.user);
        return { user: result.user, verificationSent };
    };

    const resetPassword = async (email) => {
        await sendPasswordResetEmail(auth, email.trim());
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

        // Remove referências mantidas fora do documento do usuário antes de apagar o perfil.
        const actorNotificationsSnap = await getDocs(query(
            collectionGroup(db, 'notifications'),
            where('actorUid', '==', uid)
        ));
        await deleteDocumentsInBatches(
            actorNotificationsSnap.docs.map((snapshotDoc) => snapshotDoc.ref)
        );

        const likedCommentsSnap = await getDocs(query(
            collection(db, 'comments'),
            where('likedBy', 'array-contains', uid)
        ));
        await removeUserLikesInBatches(likedCommentsSnap.docs, uid);

        // 1. Limpar sub-coleções e dados órfãos
        const subCollections = ['library', 'favorite_characters', 'followed_studios', 'notifications'];
        for (const subcol of subCollections) {
            const snap = await getDocs(collection(db, 'users', uid, subcol));
            await deleteDocumentsInBatches(snap.docs.map((snapshotDoc) => snapshotDoc.ref));
        }

        // 2. Limpar comentários do usuário na coleção raiz
        const commentsSnap = await getDocs(query(collection(db, 'comments'), where('userId', '==', uid)));
        await deleteDocumentsInBatches(commentsSnap.docs.map((snapshotDoc) => snapshotDoc.ref));

        // 3. Deletar documento principal do usuário
        await deleteDoc(doc(db, 'users', uid));
    };

    // Deletar Conta (com limpeza de sub-coleções)
    const deleteAccount = async (password) => {
        if (!auth.currentUser) return;

        const currentUser = auth.currentUser;
        const uid = currentUser.uid;
        const providerIds = currentUser.providerData.map((provider) => provider.providerId);

        try {
            // Confirmar identidade antes da limpeza evita perda de dados se a autenticação falhar.
            if (providerIds.includes('password')) {
                if (!password) {
                    const passwordRequiredError = new Error('Digite sua senha atual para confirmar.');
                    passwordRequiredError.code = 'auth/password-required';
                    throw passwordRequiredError;
                }

                const credential = EmailAuthProvider.credential(currentUser.email, password);
                await reauthenticateWithCredential(currentUser, credential);
            } else if (providerIds.includes('google.com')) {
                await reauthenticateWithPopup(currentUser, googleProvider);
            } else {
                const unsupportedProviderError = new Error('Método de entrada não compatível com exclusão.');
                unsupportedProviderError.code = 'auth/unsupported-provider';
                throw unsupportedProviderError;
            }

            await cleanupUserData(uid);

            // Deletar usuário da Autenticação
            await deleteUser(currentUser);

        } catch (error) {
            console.error("Erro ao deletar conta:", error);
            throw error;
        }
    };

    // Monitorar Estado
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) await ensureUserDocument(currentUser);
            } catch (error) {
                console.error('Erro ao preparar o perfil do usuário:', error);
            } finally {
                setUser(currentUser);
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    const value = {
        user,
        signInGoogle,
        signInEmail,
        signUpEmail,
        resetPassword,
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
