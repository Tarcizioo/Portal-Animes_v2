import { useState, useEffect, useCallback } from 'react';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { notifyCommentLike } from '@/services/notificationService';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';

const COMMENTS_PER_PAGE = 20;

export function useComments(animeId, profile = null, animeTitle = '') {
  const { user } = useAuth();
  const safeAnimeId = animeId ? String(animeId) : null;
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentsLimit, setCommentsLimit] = useState(COMMENTS_PER_PAGE);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadedAnimeId, setLoadedAnimeId] = useState(null);

  useEffect(() => {
    if (!safeAnimeId) return undefined;

    const commentsRef = collection(db, 'comments');
    const commentsQuery = query(
      commentsRef,
      where('animeId', '==', safeAnimeId),
    );

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const fetchedComments = snapshot.docs.map((commentDoc) => ({
          id: commentDoc.id,
          ...commentDoc.data(),
        }));

        fetchedComments.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });

        setHasMoreComments(fetchedComments.length > commentsLimit);
        setComments(fetchedComments.slice(0, commentsLimit));
        setLoadedAnimeId(safeAnimeId);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar comentários:', error);
        setLoadedAnimeId(safeAnimeId);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [commentsLimit, safeAnimeId]);

  const loadMoreComments = useCallback(() => {
    setCommentsLimit((prev) => prev + COMMENTS_PER_PAGE);
  }, []);

  const addComment = async (content) => {
    if (!user) throw new Error('Você precisa estar logado para comentar.');
    if (!content.trim()) throw new Error('O comentário não pode estar vazio.');
    if (!safeAnimeId) throw new Error('ID do anime inválido.');

    const authorName = profile?.displayName || user.displayName || 'Usuário';
    const authorAvatar = profile?.photoURL || null;

    try {
      await addDoc(collection(db, 'comments'), {
        animeId: safeAnimeId,
        userId: user.uid,
        userName: authorName,
        userAvatar: authorAvatar,
        content: content.trim(),
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
      });
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      throw error;
    }
  };

  const deleteComment = async (commentId) => {
    if (!user) return;

    setComments((prev) => prev.filter((comment) => comment.id !== commentId));

    try {
      const commentRef = doc(db, 'comments', commentId);
      setTimeout(async () => {
        try {
          await deleteDoc(commentRef);
        } catch (internalError) {
          console.error('Firestore Delete Error (Async):', internalError);
        }
      }, 50);
    } catch (error) {
      console.error('Erro ao preparar deleção:', error);
      setLoading(true);
      throw error;
    }
  };

  const toggleLike = async (comment) => {
    if (!user) return;

    const commentRef = doc(db, 'comments', comment.id);
    const likedBy = comment.likedBy || [];
    const alreadyLiked = likedBy.includes(user.uid);

    try {
      if (alreadyLiked) {
        await updateDoc(commentRef, {
          likedBy: arrayRemove(user.uid),
          likes: increment(-1),
        });
      } else {
        await updateDoc(commentRef, {
          likedBy: arrayUnion(user.uid),
          likes: increment(1),
        });

        await notifyCommentLike(
          comment.userId,
          profile,
          user.uid,
          comment.content,
          animeId,
          animeTitle,
        );
      }
    } catch (err) {
      console.error('Erro ao curtir comentario:', err);
    }
  };

  const visibleComments = loadedAnimeId === safeAnimeId ? comments : [];
  const visibleHasMoreComments = loadedAnimeId === safeAnimeId ? hasMoreComments : false;
  const isLoadingComments = safeAnimeId ? (loadedAnimeId !== safeAnimeId || loading) : false;

  return {
    comments: visibleComments,
    loading: isLoadingComments,
    addComment,
    deleteComment,
    toggleLike,
    hasMoreComments: visibleHasMoreComments,
    loadMoreComments,
  };
}
