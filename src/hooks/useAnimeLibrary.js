import { useCallback, useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { APP_CONFIG } from '@/constants/app';
import { useToast } from '@/context/ToastContext';
import { anilistApi } from '@/services/anilistApi';
import { PRODUCT_EVENTS, trackProductEvent } from '@/services/productAnalytics';
import {
    collection,
    query,
    onSnapshot,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    getDoc,
    increment,
    runTransaction,
} from 'firebase/firestore';

// Returns today as "YYYY-MM-DD" in local time
const toDateKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getEventSource = (options) => options?.source || 'unknown';

export function useAnimeLibrary() {
    const { user } = useAuth();
    const userId = user?.uid || null;
    const { toast } = useToast(); // Use Toast
    const [subscriptionVersion, setSubscriptionVersion] = useState(0);
    const [subscriptionState, setSubscriptionState] = useState({
        uid: null,
        version: 0,
        library: [],
        loading: true,
        error: null,
    });

    // 1. Escutar Mudanças em Tempo Real
    useEffect(() => {
        if (!userId) {
            const resetTimer = setTimeout(() => {
                setSubscriptionState({
                    uid: null,
                    version: subscriptionVersion,
                    library: [],
                    loading: false,
                    error: null,
                });
            }, 0);
            return () => clearTimeout(resetTimer);
        }

        const libraryRef = collection(db, 'users', userId, APP_CONFIG.LIBRARY.COLLECTION_NAME);
        const q = query(libraryRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const animeList = snapshot.docs.map(doc => ({
                id: doc.id, // ID é sempre String no Firestore
                ...doc.data()
            }));
            setSubscriptionState({
                uid: userId,
                version: subscriptionVersion,
                library: animeList,
                loading: false,
                error: null,
            });
        }, (error) => {
            console.error("Erro ao buscar biblioteca:", error);
            setSubscriptionState((current) => ({
                uid: userId,
                version: subscriptionVersion,
                library: current.uid === userId && current.version === subscriptionVersion
                    ? current.library
                    : [],
                loading: false,
                error,
            }));
        });

        return () => unsubscribe();
    }, [subscriptionVersion, userId]);

    const isCurrentSubscription = subscriptionState.uid === userId
        && subscriptionState.version === subscriptionVersion;
    const library = userId && isCurrentSubscription ? subscriptionState.library : [];
    const loading = Boolean(userId) && (!isCurrentSubscription || subscriptionState.loading);
    const error = userId && isCurrentSubscription ? subscriptionState.error : null;

    const retry = useCallback(() => {
        if (!userId) return;
        setSubscriptionVersion((current) => current + 1);
    }, [userId]);

    // Helper para Mapeamento Seguro
    const mapAnimeData = (anime, existingData = {}, status = 'plan_to_watch') => {
        const id = anime.mal_id || anime.id;
        const safeId = String(id);

        // Determina episódios assistidos
        let currentEp = 0;
        if (status === 'completed') {
            currentEp = anime.episodes || existingData.currentEp || 0;
        } else if (existingData.currentEp !== undefined) {
            currentEp = existingData.currentEp;
        }

        // Lógica de Imagem: Prioiriza Full HD (Large) -> Standard -> Fallback
        const imageUrl = anime.images?.webp?.large_image_url ||
            anime.images?.jpg?.large_image_url ||
            anime.images?.webp?.image_url ||
            anime.images?.jpg?.image_url ||
            anime.image ||
            null;

        // Lógica de Gêneros: pode vir como strings ou objetos normalizados da API
        let genres = [];
        if (Array.isArray(anime.genres)) {
            if (typeof anime.genres[0] === 'string') {
                genres = anime.genres; // Já mapeado
            } else {
                genres = (anime.genres || []).map(g => g.name); // Mapeia objetos
            }
        }
        // Se for Raw, pode ter themes/demographics
        if (Array.isArray(anime.themes)) genres = genres.concat(anime.themes.map(t => t.name));
        if (Array.isArray(anime.demographics)) genres = genres.concat(anime.demographics.map(d => d.name));

        // Remove duplicatas de gêneros
        genres = [...new Set(genres)];

        return {
            id: safeId, // ID normalizado como String
            title: anime.title || anime.title_english || 'Sem Título',
            image: imageUrl,
            totalEp: anime.episodes || 0,
            currentEp: currentEp,
            score: existingData.score || 0, // Nota do Usuário
            status: status,
            lastUpdated: serverTimestamp(),

            // Metadados Ricos
            genres: genres,
            year: anime.year || anime.aired?.prop?.from?.year || null,
            season: anime.season || null,
            type: anime.type || 'TV',
            synopsis: anime.synopsis || '',
            studios: anime.studios ? anime.studios.map(s => s.name) : [],
            members: anime.members || 0,

            // Preservar flags
            isFavorite: existingData.isFavorite || false
        };
    };

    // 2. Adicionar Anime (ou Atualizar)
    const addToLibrary = async (anime, status = 'plan_to_watch', options = { source: 'unknown' }) => {
        if (!user) {
            toast.warning("Faça login para adicionar à biblioteca.", "Login Necessário");
            return;
        }

        try {
            const animeId = anime.mal_id || anime.id;
            if (!animeId) {
                console.error("ID do anime inválido:", anime);
                return;
            }
            const docId = String(animeId);
            const animeRef = doc(db, 'users', user.uid, APP_CONFIG.LIBRARY.COLLECTION_NAME, docId);

            // Verificar existência
            const docSnap = await getDoc(animeRef);
            const exists = docSnap.exists();
            const existingData = exists ? docSnap.data() : {};

            const animeData = mapAnimeData(anime, existingData, status);
            if (options.initialFavorite === true) animeData.isFavorite = true;

            await setDoc(animeRef, animeData, { merge: true });


            if (!exists) {
                void trackProductEvent(PRODUCT_EVENTS.LIBRARY_UPDATED, {
                    action: 'add',
                    anime_id: Number(animeId),
                    status,
                    source: getEventSource(options),
                });

                toast.success("Anime adicionado à biblioteca!", "Sucesso");
            } else {
                // toast.info("Informações do anime atualizadas.", "Atualizado"); // Maybe too frequent
            }

        } catch (error) {
            console.error("Erro ao adicionar anime:", error);
            toast.error("Erro ao adicionar anime.", "Erro");
            throw error;
        }
    };

    // 3. Atualizar Progresso
    const updateProgress = async (animeId, newEp, totalEp, options = { source: 'unknown' }) => {
        if (!user) return;

        // Validações
        if (newEp < 0) newEp = 0;
        if (totalEp > 0 && newEp > totalEp) newEp = totalEp;

        try {
            const animeRef = doc(db, 'users', user.uid, APP_CONFIG.LIBRARY.COLLECTION_NAME, String(animeId));

            const { previousEpisode } = await runTransaction(db, async (transaction) => {
                const snap = await transaction.get(animeRef);
                const oldEp = snap.exists() ? (snap.data().currentEp || 0) : 0;
                const epsWatched = newEp - oldEp;
                const progressTimestamp = serverTimestamp();
                const updates = {
                    currentEp: newEp,
                    lastUpdated: progressTimestamp,
                    lastProgressAt: progressTimestamp,
                };

                if (totalEp > 0 && newEp === totalEp) {
                    updates.status = 'completed';
                }

                transaction.update(animeRef, updates);

                if (epsWatched > 0) {
                    const dateKey = toDateKey();
                    const userRef = doc(db, 'users', user.uid);
                    transaction.update(userRef, {
                        [`activityLog.${dateKey}`]: increment(epsWatched)
                    });
                }

                return { previousEpisode: oldEp };
            });

            if (totalEp > 0 && newEp === totalEp) {
                toast.success("Anime concluído!", "Parabéns");
            }

            void trackProductEvent(PRODUCT_EVENTS.PROGRESS_UPDATED, {
                anime_id: Number(animeId),
                episode: newEp,
                previous_episode: previousEpisode,
                total_episodes: totalEp,
                source: getEventSource(options),
            });
        } catch (error) {
            console.error("Erro ao atualizar progresso:", error);
            toast.error("Falha ao salvar progresso.", "Erro");
            throw error;
        }
    };

    const incrementProgress = (animeId, currentEp, totalEp, options = { source: 'unknown' }) => {
        return updateProgress(animeId, currentEp + 1, totalEp, options);
    };

    // 4. Mudar Status
    const updateStatus = async (animeId, newStatus, totalEp = 0, options = { source: 'unknown' }) => {
        if (!user) return;
        try {
            const animeRef = doc(db, 'users', user.uid, APP_CONFIG.LIBRARY.COLLECTION_NAME, String(animeId));
            const updates = {
                status: newStatus,
                lastUpdated: serverTimestamp()
            };
            if (newStatus === 'completed' && totalEp > 0) {
                updates.currentEp = totalEp;
            }
            await updateDoc(animeRef, updates);

            void trackProductEvent(PRODUCT_EVENTS.LIBRARY_UPDATED, {
                action: 'status_change',
                anime_id: Number(animeId),
                status: newStatus,
                source: getEventSource(options),
            });
            toast.success("Status atualizado.", "Biblioteca");
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Erro ao atualizar status.", "Erro");
        }
    };

    // 5. Atualizar Nota
    const updateRating = async (animeId, newScore) => {
        if (!user) return;
        try {
            const animeRef = doc(db, 'users', user.uid, APP_CONFIG.LIBRARY.COLLECTION_NAME, String(animeId));
            await updateDoc(animeRef, {
                score: newScore,
                lastUpdated: serverTimestamp()
            });
            // Toast removed for rating to be unobtrusive or maybe just subtle
            // toast.success("Nota salva!", "Avaliação");
        } catch (error) {
            console.error("Erro ao atualizar nota:", error);
            toast.error("Erro ao salvar nota.", "Erro");
        }
    };

    // 6. Remover Anime
    const removeFromLibrary = async (animeId, options = { source: 'unknown' }) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, APP_CONFIG.LIBRARY.COLLECTION_NAME, String(animeId)));

            void trackProductEvent(PRODUCT_EVENTS.LIBRARY_UPDATED, {
                action: 'remove',
                anime_id: Number(animeId),
                source: getEventSource(options),
            });
            toast.info("Anime removido da biblioteca.", "Removido");
        } catch (error) {
            console.error("Erro ao remover anime:", error);
            toast.error("Erro ao remover anime.", "Erro");
            throw error;
        }
    };

    // 7. Toggle Favorito
    const toggleFavorite = async (anime, options = { source: 'unknown' }) => {
        if (!user) throw new Error("Usuário não autenticado");

        const rawId = anime.id || anime.mal_id;
        const animeId = String(rawId);

        const libraryItem = library.find(item => item.id === animeId);
        const isCurrentlyFavorite = libraryItem?.isFavorite;

        if (!isCurrentlyFavorite) {
            const favoritesCount = library.filter(item => item.isFavorite).length;
            if (favoritesCount >= APP_CONFIG.LIBRARY.MAX_FAVORITES) {
                const msg = `Você já possui ${APP_CONFIG.LIBRARY.MAX_FAVORITES} favoritos.`;
                toast.error(msg, "Limite Atingido");
                throw new Error(msg);
            }
        }

        try {
            const animeRef = doc(db, 'users', user.uid, APP_CONFIG.LIBRARY.COLLECTION_NAME, animeId);

            if (!libraryItem) {
                await addToLibrary(anime, 'plan_to_watch', {
                    ...options,
                    initialFavorite: true,
                });
                toast.success("Adicionado aos Favoritos!", "Favoritou");
            } else {
                await updateDoc(animeRef, { isFavorite: !isCurrentlyFavorite });
                if (!isCurrentlyFavorite) toast.success("Adicionado aos Favoritos!", "Favoritou");
                else toast.info("Removido dos Favoritos.", "Desfavoritou");
            }

            void trackProductEvent(PRODUCT_EVENTS.LIBRARY_UPDATED, {
                action: 'favorite_change',
                anime_id: Number(animeId),
                source: getEventSource(options),
            });
        } catch (error) {
            console.error("Erro ao alterar favorito:", error);
            toast.error("Erro ao alterar favorito.", "Erro");
            throw error;
        }
    };

    // 8. Sincronizar Dados (Otimizado com Queue)
    const syncLibraryData = async (onProgress) => {
        if (!user || !library.length) return;

        const animesToUpdate = library.filter(anime => {
            const hasSynopsis = !!anime.synopsis;
            const hasGenerosArray = Array.isArray(anime.genres);
            const hasSafeId = typeof anime.id === 'string'; // Garante que atualize legados
            return !hasSynopsis || !hasGenerosArray || !hasSafeId;
        });

        if (animesToUpdate.length === 0) return 0;

        toast.info(`Sincronizando ${animesToUpdate.length} animes...`, "Manutenção");

        let processed = 0;
        const total = animesToUpdate.length;

        try {
            const response = await anilistApi.getAnimeByMalIds(
                animesToUpdate.map((anime) => anime.id)
            );
            const freshById = new Map(
                (response.data || []).map((anime) => [String(anime.mal_id), anime])
            );

            for (const anime of animesToUpdate) {
                const freshData = freshById.get(String(anime.id));
                if (freshData) {
                    await addToLibrary(freshData, anime.status);
                }
                processed++;
                onProgress?.(processed, total);
            }
        } catch (error) {
            console.error('Falha ao sincronizar a biblioteca pela AniList:', error);
            toast.error('Não foi possível concluir a sincronização.', 'Erro');
            throw error;
        }

        toast.success("Sincronização concluída!", "Sucesso");
    };

    // 9. Atualizar Imagem
    const updateAnimeImage = async (animeId, newImageUrl) => {
        if (!user || !animeId || !newImageUrl) return;
        try {
            const animeRef = doc(db, 'users', user.uid, APP_CONFIG.LIBRARY.COLLECTION_NAME, String(animeId));
            await updateDoc(animeRef, { image: newImageUrl, lastUpdated: serverTimestamp() });
        } catch (error) {
            console.error("Erro ao atualizar a imagem do anime:", error);
            throw error;
        }
    };

    return {
        library,
        loading,
        error,
        retry,
        refetch: retry,
        addToLibrary,
        incrementProgress,
        updateProgress,
        updateStatus,
        updateRating,
        removeFromLibrary,
        toggleFavorite,
        syncLibraryData,
        updateAnimeImage
    };
}
