import { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import {
    collection,
    query,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    serverTimestamp,
} from 'firebase/firestore';

export function useCharacterLibrary() {
    const { user } = useAuth();
    const [characterLibrary, setCharacterLibrary] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Escutar Mudanças em Tempo Real
    useEffect(() => {
        if (!user) {
            setCharacterLibrary([]);
            setLoading(false);
            return;
        }

        const libraryRef = collection(db, 'users', user.uid, 'favorite_characters');
        const q = query(libraryRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map((snapshotDoc) => {
                const data = snapshotDoc.data();
                return { ...data, id: data.id ?? snapshotDoc.id };
            });
            setCharacterLibrary(list);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar favoritos de personagens:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // 2. Toggle Favorito (Max 3)
    const toggleCharacterFavorite = async (character) => {
        if (!user) {
            console.warn("Usuário não autenticado tentar favoritar");
            throw new Error("Faça login para favoritar.");
        }

        const charId = character.mal_id || character.id;
        if (!charId) throw new Error("ID do personagem inválido");

        const isFavorite = characterLibrary.some((item) => String(item.id) === String(charId));

        try {
            const charRef = doc(db, 'users', user.uid, 'favorite_characters', charId.toString());

            if (isFavorite) {
                // Remover
                await deleteDoc(charRef);
            } else {
                // Adicionar - Verificar Limite
                if (characterLibrary.length >= 10) {
                    throw new Error("Você já possui 10 personagens favoritos. Remova um para adicionar outro.");
                }

                // Salvar dados mínimos para exibição
                const charData = {
                    id: charId,
                    name: character.name,
                    image: character.images?.webp?.large_image_url || character.images?.jpg?.large_image_url || character.images?.jpg?.image_url || character.image,
                    addedAt: serverTimestamp()
                    // Podemos adicionar 'about' ou outros campos se quisermos cachear
                };

                await setDoc(charRef, charData);
            }
        } catch (error) {
            console.error("Erro ao alterar favorito de personagem:", error);
            throw error;
        }
    };

    const isCharacterFavorite = (charId) => {
        if (!charId) return false;
        // console.log("Checking Favorite:", charId, typeof charId, "Library:", characterLibrary);
        return characterLibrary.some(c => String(c.id) === String(charId));
    };

    // 3. Atualizar Imagem
    const updateCharacterImage = async (charId, newImageUrl) => {
        if (!user || !charId || !newImageUrl) return;
        try {
            const charRef = doc(db, 'users', user.uid, 'favorite_characters', String(charId));
            await setDoc(charRef, { image: newImageUrl }, { merge: true });
        } catch (error) {
            console.error("Erro ao atualizar imagem do personagem:", error);
            throw error;
        }
    };

    return {
        characterLibrary,
        loading,
        toggleCharacterFavorite,
        isCharacterFavorite,
        updateCharacterImage
    };
}
