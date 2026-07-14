import { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

export function usePublicProfile(userId) {
    const [profile, setProfile] = useState(null);
    const [library, setLibrary] = useState([]);
    const [characterFavorites, setCharacterFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchPublicData() {
            if (!userId) return;

            setLoading(true);
            setError(null);

            try {
                // 1. Buscar Perfil do Usuário
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    setError('Usuário não encontrado');
                    setLoading(false);
                    return;
                }

                const userData = userSnap.data();

                // 2. Verificar Privacidade (Padrão: Público se undefined)
                const isPublic = userData.isPublic !== false;

                if (!isPublic) {
                    setError('Este perfil é privado.');
                    setLoading(false);
                    return;
                }

                // 3. Buscar Biblioteca e Favoritos em paralelo
                const [librarySnap, charFavSnap] = await Promise.all([
                    getDocs(collection(db, 'users', userId, 'library')),
                    getDocs(collection(db, 'users', userId, 'favorite_characters')),
                ]);

                const mapDocument = (snapshotDoc) => {
                    const data = snapshotDoc.data();
                    return { ...data, id: data.id ?? snapshotDoc.id };
                };
                const libraryData = librarySnap.docs.map(mapDocument);
                const charFavData = charFavSnap.docs.map(mapDocument);

                setProfile(userData);
                setLibrary(libraryData);
                setCharacterFavorites(charFavData);

            } catch (err) {
                console.error("Erro ao carregar perfil público:", err);
                setError('Falha ao carregar perfil');
            } finally {
                setLoading(false);
            }
        }

        fetchPublicData();
    }, [userId]);

    return { profile, library, characterFavorites, loading, error };
}
