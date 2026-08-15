import { useCallback } from 'react';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { anilistApi } from '@/services/anilistApi';
import { APP_CONFIG } from '@/constants/app';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// ── Status mappings ───────────────────────────────────────────────────────────

const MAL_STATUS_MAP = {
    'Watching':       'watching',
    'Completed':      'completed',
    'On-Hold':        'paused',
    'Dropped':        'dropped',
    'Plan to Watch':  'plan_to_watch',
};

// ── Download helper ───────────────────────────────────────────────────────────

function triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useLibraryBackup(library = []) {
    const { user } = useAuth();

    // ── EXPORT JSON ───────────────────────────────────────────────────────────
    const exportJSON = useCallback(() => {
        const payload = library.map(a => ({
            id:         a.id,
            title:      a.title,
            image:      a.image,
            status:     a.status,
            score:      a.score || 0,
            currentEp:  a.currentEp || 0,
            totalEp:    a.totalEp || 0,
            isFavorite: a.isFavorite || false,
            genres:     a.genres || [],
            studios:    a.studios || [],
            type:       a.type || 'TV',
            year:       a.year || null,
            season:     a.season || null,
        }));
        triggerDownload(
            JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), animes: payload }, null, 2),
            `portalanimes_backup_${todayStr()}.json`,
            'application/json',
        );
    }, [library]);

    // ── EXPORT CSV ────────────────────────────────────────────────────────────
    const exportCSV = useCallback(() => {
        const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const headers = ['ID','Título','Status','Nota','Eps Vistos','Eps Totais','Gêneros','Estúdios','Tipo','Ano','Favorito'];
        const rows = library.map(a => [
            a.id,
            escape(a.title),
            a.status,
            a.score || 0,
            a.currentEp || 0,
            a.totalEp || 0,
            escape((a.genres || []).join('; ')),
            escape((a.studios || []).join('; ')),
            a.type || 'TV',
            a.year || '',
            a.isFavorite ? 'Sim' : 'Não',
        ].join(','));
        triggerDownload(
            [headers.join(','), ...rows].join('\n'),
            `portalanimes_biblioteca_${todayStr()}.csv`,
            'text/csv;charset=utf-8;',
        );
    }, [library]);

    // ── IMPORT JSON (our format) ───────────────────────────────────────────────
    /**
     * Parses a JSON file and returns a preview + import function.
     * @returns {Promise<{ count: number, items: Array, commit: Function }>}
     */
    const parseJSON = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const raw = JSON.parse(e.target.result);
                    // Accept both { animes: [...] } and a bare array
                    const items = Array.isArray(raw) ? raw : raw.animes;
                    if (!Array.isArray(items)) throw new Error('Formato inválido');
                    const valid = items.filter(a => a.id && a.title && a.status);
                    resolve({ count: valid.length, items: valid });
                } catch {
                    reject(new Error('Arquivo JSON inválido ou corrompido.'));
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
            reader.readAsText(file);
        });
    }, []);

    // ── IMPORT MAL XML ────────────────────────────────────────────────────────
    const parseMAL = useCallback((file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const parser = new DOMParser();
                    const xml    = parser.parseFromString(e.target.result, 'text/xml');
                    const nodes  = xml.querySelectorAll('anime');
                    if (!nodes.length) throw new Error('Nenhum anime encontrado no XML.');

                    const items = [...nodes].map(node => {
                        const get = (tag) => node.querySelector(tag)?.textContent?.trim() ?? '';
                        const malStatus = get('my_status');
                        return {
                            id:         get('series_animedb_id'),
                            title:      get('series_title'),
                            image:      null,  // MAL export doesn't include images
                            status:     MAL_STATUS_MAP[malStatus] || 'plan_to_watch',
                            score:      Number(get('my_score')) || 0,
                            currentEp:  Number(get('my_watched_episodes')) || 0,
                            totalEp:    Number(get('series_episodes')) || 0,
                            isFavorite: false,
                            genres:     [],
                            studios:    [],
                            type:       get('series_type') || 'TV',
                            year:       null,
                        };
                    }).filter(a => a.id && a.title);

                    resolve({ count: items.length, items });
                } catch (err) {
                    reject(new Error(err.message || 'Arquivo MAL inválido.'));
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
            reader.readAsText(file, 'UTF-8');
        });
    }, []);

    // ── COMMIT IMPORT to Firestore ─────────────────────────────────────────────
    /**
     * @param {Array}   items         - parsed anime items
     * @param {boolean} overwrite     - replace existing docs
     * @param {Function} onProgress   - (done, total) => void
     */
    const commitImport = useCallback(async (items, overwrite = true, onProgress) => {
        if (!user) throw new Error('Usuário não autenticado.');
        const colName = APP_CONFIG.LIBRARY.COLLECTION_NAME;
        let done = 0;

        // Build existing id set for skip-if-exists logic
        const existingIds = new Set(library.map(a => String(a.id)));

        // 1. Separate items we need to process
        const itemsToProcess = items.filter(item => overwrite || !existingIds.has(String(item.id)));
        const skippedCount = items.length - itemsToProcess.length;
        done += skippedCount;

        // 2. Hydrate missing metadata in batches through AniList.
        const missingImageItems = itemsToProcess.filter(a => !a.image);
        if (missingImageItems.length > 0) {
            const response = await anilistApi.getAnimeByMalIds(
                missingImageItems.map((item) => item.id)
            );
            const animeById = new Map(
                (response.data || []).map((anime) => [String(anime.mal_id), anime])
            );

            missingImageItems.forEach((item, index) => {
                const animeData = animeById.get(String(item.id));
                if (animeData) {
                    item.image = animeData.images?.webp?.large_image_url || animeData.images?.jpg?.large_image_url || null;
                    item.genres = animeData.genres?.map((genre) => genre.name) || [];
                    item.studios = animeData.studios?.map((studio) => studio.name) || [];
                    item.year = animeData.year || null;
                    item.season = animeData.season || null;
                }
                onProgress?.(done + index + 1, items.length);
            });

            done += missingImageItems.length;
        }

        // 3. Save to Firestore
        for (const item of itemsToProcess) {
            const id = String(item.id);
            const ref = doc(db, 'users', user.uid, colName, id);
            await setDoc(ref, {
                id,
                title:      item.title,
                image:      item.image || null,
                status:     item.status,
                score:      item.score || 0,
                currentEp:  item.currentEp || 0,
                totalEp:    item.totalEp || 0,
                isFavorite: item.isFavorite || false,
                genres:     item.genres || [],
                studios:    item.studios || [],
                type:       item.type || 'TV',
                year:       item.year || null,
                season:     item.season || null,
                lastUpdated: serverTimestamp(),
            }, { merge: !overwrite });
            done++;
            onProgress?.(done, items.length);
        }
        // Em caso de itens 100% pulados
        if (itemsToProcess.length === 0 && onProgress) {
            onProgress(items.length, items.length);
        }
    }, [user, library]);

    return { exportJSON, exportCSV, parseJSON, parseMAL, commitImport };
}
