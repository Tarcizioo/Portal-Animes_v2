import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const DEFAULT_STUDIO_STATE = {
  uid: null,
  studioKey: null,
  isFavorite: false,
};

const DEFAULT_FAVORITES_STATE = {
  uid: null,
  studios: [],
};

export function getStudioKey(studioOrId) {
  const value = typeof studioOrId === 'object' && studioOrId !== null
    ? studioOrId.id || studioOrId.mal_id
    : studioOrId;
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

export function useFavoriteStudios(studioId = null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const uid = user?.uid ?? null;
  const normalizedStudioId = getStudioKey(studioId);
  const [studioState, setStudioState] = useState(DEFAULT_STUDIO_STATE);
  const [favoritesState, setFavoritesState] = useState(DEFAULT_FAVORITES_STATE);

  useEffect(() => {
    if (!uid || !normalizedStudioId) return undefined;

    const docRef = doc(db, 'users', uid, 'followed_studios', normalizedStudioId);
    return onSnapshot(docRef, (snapshot) => {
      setStudioState({
        uid,
        studioKey: normalizedStudioId,
        isFavorite: snapshot.exists(),
      });
    }, (error) => {
      console.error('Erro ao verificar estúdio favorito:', error);
      setStudioState({ uid, studioKey: normalizedStudioId, isFavorite: false });
    });
  }, [uid, normalizedStudioId]);

  useEffect(() => {
    if (!uid) return undefined;

    const studiosQuery = query(collection(db, 'users', uid, 'followed_studios'));
    return onSnapshot(studiosQuery, (snapshot) => {
      const studios = snapshot.docs.map((studioDoc) => ({
        ...studioDoc.data(),
        id: studioDoc.id,
      }));
      setFavoritesState({ uid, studios });
    }, (error) => {
      console.error('Erro ao carregar estúdios favoritos:', error);
      setFavoritesState({ uid, studios: [] });
    });
  }, [uid]);

  const favoriteStudios = useMemo(() => {
    if (!uid || favoritesState.uid !== uid) return [];
    return favoritesState.studios;
  }, [favoritesState.studios, favoritesState.uid, uid]);

  const isFavorite = useMemo(() => {
    if (!uid || !normalizedStudioId) return false;

    if (studioState.uid === uid && studioState.studioKey === normalizedStudioId) {
      return studioState.isFavorite;
    }

    return favoriteStudios.some((favorite) => getStudioKey(favorite) === normalizedStudioId);
  }, [favoriteStudios, normalizedStudioId, studioState.isFavorite, studioState.studioKey, studioState.uid, uid]);

  const loading = Boolean(
    uid
    && normalizedStudioId
    && (studioState.uid !== uid || studioState.studioKey !== normalizedStudioId)
  );

  const toggleFavorite = async (studioData) => {
    if (!uid) {
      toast.error('Você precisa estar logado para seguir estúdios!', 'Login necessário');
      return false;
    }

    const studioKey = getStudioKey(studioData);
    if (!studioKey) {
      toast.error('Estúdio inválido.', 'Falha');
      return false;
    }

    const listedAsFavorite = favoriteStudios.some((favorite) => getStudioKey(favorite) === studioKey);
    const isCurrentStudio = normalizedStudioId === studioKey;
    const isAlreadyFavorite = isCurrentStudio ? isFavorite || listedAsFavorite : listedAsFavorite;

    if (!isAlreadyFavorite && favoriteStudios.length >= 3) {
      toast.error('Você só pode seguir até 3 estúdios!', 'Limite atingido');
      return false;
    }

    const docRef = doc(db, 'users', uid, 'followed_studios', studioKey);
    if (isCurrentStudio) {
      setStudioState({ uid, studioKey, isFavorite: !isAlreadyFavorite });
    }

    try {
      if (isAlreadyFavorite) {
        await deleteDoc(docRef);
        toast.info('Você deixou de seguir o estúdio.', 'Removido');
        return true;
      }

      const name = String(
        studioData?.titles?.[0]?.title || studioData?.title || studioData?.name || 'Estúdio sem nome',
      ).trim();
      const image = studioData?.image
        || studioData?.images?.webp?.large_image_url
        || studioData?.images?.webp?.image_url
        || studioData?.images?.jpg?.large_image_url
        || studioData?.images?.jpg?.image_url
        || null;

      await setDoc(docRef, {
        id: studioKey,
        mal_id: studioKey,
        name,
        image,
        addedAt: serverTimestamp(),
      });

      toast.success('Estúdio seguido com sucesso!', 'Favorito');
      return true;
    } catch (error) {
      if (isCurrentStudio) {
        setStudioState({ uid, studioKey, isFavorite: isAlreadyFavorite });
      }
      console.error('Erro ao atualizar estúdio favorito:', error);
      toast.error('Não foi possível atualizar. Tente novamente.', 'Falha');
      return false;
    }
  };

  return { isFavorite, toggleFavorite, favoriteStudios, loading, user };
}
