import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { anilistApi } from '@/services/anilistApi';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { LayoutGrid, List, Search, Loader2 } from 'lucide-react';
import { AnimeCard } from '@/components/ui/AnimeCard';
import { AnimeListItem } from '@/components/ui/AnimeListItem';
import { CharacterCard } from '@/components/ui/CharacterCard';
import { CharacterListItem } from '@/components/ui/CharacterListItem';
import { PersonCard } from '@/components/ui/PersonCard';
import { PersonListItem } from '@/components/ui/PersonListItem';
import { StudioCard } from '@/components/ui/StudioCard';
import { StudioListItem } from '@/components/ui/StudioListItem';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
    { value: 'all', label: 'Tudo' },
    { value: 'anime', label: 'Animes' },
    { value: 'character', label: 'Personagens' },
    { value: 'person', label: 'Pessoas' },
    { value: 'studio', label: 'Estúdios' }
];

export function GlobalSearch() {
    const [searchParams, setSearchParams] = useSearchParams();

    const query = searchParams.get('q') || '';
    const activeTab = searchParams.get('type') || 'all';

    const [loading, setLoading] = useState(false);
    
    // Results
    const [animeResults, setAnimeResults] = useState([]);
    const [characterResults, setCharacterResults] = useState([]);
    const [personResults, setPersonResults] = useState([]);
    const [studioResults, setStudioResults] = useState([]);

    const [viewMode, setViewMode] = useState(() => localStorage.getItem('global_search_view_mode') || 'grid');
    
    useEffect(() => {
        localStorage.setItem('global_search_view_mode', viewMode);
    }, [viewMode]);

    usePageTitle(query ? `Busca: ${query}` : 'Busca Global');

    const handleTabChange = (val) => {
        setSearchParams({ q: query, type: val });
    };

    useEffect(() => {
        if (!query) {
            setAnimeResults([]);
            setCharacterResults([]);
            setPersonResults([]);
            setStudioResults([]);
            return;
        }

        let isMounted = true;
        const controller = new AbortController();

        const fetchResults = async () => {
            setLoading(true);
            try {
                // Determine limits based on tab
                const isAll = activeTab === 'all';
                const limit = isAll ? 10 : 25; // In 'all' tab we show fewer items per category

                if (isMounted) {
                    setAnimeResults([]);
                    setCharacterResults([]);
                    setPersonResults([]);
                    setStudioResults([]);
                }

                if (activeTab === 'studio') {
                    const response = await anilistApi.searchStudios(query, limit, { signal: controller.signal });
                    if (isMounted) setStudioResults(response.data || []);
                    return;
                }

                const catalog = await anilistApi.searchCatalog(query, limit, {
                    anime: isAll || activeTab === 'anime',
                    characters: isAll || activeTab === 'character',
                    people: isAll || activeTab === 'person',
                }, { signal: controller.signal });

                if (!isMounted) return;
                setAnimeResults(catalog.anime);
                setCharacterResults(catalog.characters);
                setPersonResults(catalog.people);
                setStudioResults([]);

            } catch (error) {
                if (error.name !== 'AbortError' && isMounted) {
                    console.error('Erro na busca global:', error);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchResults();

        return () => {
            isMounted = false;
            controller.abort();
        };

    }, [query, activeTab]);

    const renderGrid = (items, type) => {
        if (items.length === 0) return null;

        return (
            <motion.div 
                layout
                className={clsx(
                    viewMode === 'grid' 
                    ? "grid gap-4 sm:gap-6" 
                    : "flex flex-col gap-4",
                    viewMode === 'grid' && type === 'anime' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "",
                    viewMode === 'grid' && (type === 'character' || type === 'person') ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "",
                    viewMode === 'grid' && type === 'studio' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : ""
                )}
            >
                <AnimatePresence mode="popLayout">
                    {items.map((item, index) => (
                        <motion.div key={`${type}-${item.mal_id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.05 }} layout>
                            {type === 'anime' && (
                                viewMode === 'grid' 
                                ? <AnimeCard {...item} id={item.mal_id} image={item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url} />
                                : <AnimeListItem {...item} id={item.mal_id} image={item.images?.webp?.large_image_url || item.images?.jpg?.large_image_url} />
                            )}
                            {type === 'character' && (
                                viewMode === 'grid'
                                ? <CharacterCard character={item} />
                                : <CharacterListItem character={item} />
                            )}
                            {type === 'person' && (
                                viewMode === 'grid'
                                ? <PersonCard person={item} />
                                : <PersonListItem person={item} />
                            )}
                            {type === 'studio' && (
                                viewMode === 'grid'
                                ? <StudioCard studio={item} />
                                : <StudioListItem studio={item} />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto">
            {/* Header & Search Bar inside Page */}
            <div className="mb-10 pb-8 border-b border-border-color">
                <h1 className="text-3xl md:text-5xl font-black text-text-primary tracking-tight mb-2">
                    {query ? (
                        <>Resultados de "<span className="text-primary">{query}</span>"</>
                    ) : (
                        "Busca Global"
                    )}
                </h1>
                <p className="text-text-secondary">Encontre animes, personagens, dubladores e estúdios em um só lugar.</p>
            </div>

            {/* Results Area */}
            {query ? (
                <>
                    {/* Tabs & View Toggle */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                        <div className="flex bg-bg-secondary p-1 rounded-xl border border-border-color w-full sm:w-auto overflow-x-auto no-scrollbar">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    onClick={() => handleTabChange(cat.value)}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                                        activeTab === cat.value
                                        ? "bg-bg-primary text-text-primary shadow-sm ring-1 ring-border-color"
                                        : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
                                    )}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <ViewToggle 
                            value={viewMode} 
                            onChange={setViewMode} 
                            options={[
                                { value: 'grid', label: '', icon: LayoutGrid },
                                { value: 'list', label: '', icon: List }
                            ]} 
                        />
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-primary">
                            <Loader2 className="w-12 h-12 animate-spin mb-4" />
                            <p className="font-bold text-lg text-text-primary">Buscando resultados...</p>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            
                            {/* ALL / ANIME SECTION */}
                            {(activeTab === 'all' || activeTab === 'anime') && animeResults.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">🎬 Animes <span className="text-sm font-normal text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-full">{animeResults.length}</span></h2>
                                    {renderGrid(animeResults, 'anime')}
                                </section>
                            )}

                            {/* ALL / CHARACTER SECTION */}
                            {(activeTab === 'all' || activeTab === 'character') && characterResults.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">🎭 Personagens <span className="text-sm font-normal text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-full">{characterResults.length}</span></h2>
                                    {renderGrid(characterResults, 'character')}
                                </section>
                            )}

                            {/* ALL / PERSON SECTION */}
                            {(activeTab === 'all' || activeTab === 'person') && personResults.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">🎙️ Pessoas <span className="text-sm font-normal text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-full">{personResults.length}</span></h2>
                                    {renderGrid(personResults, 'person')}
                                </section>
                            )}

                            {/* ALL / STUDIO SECTION */}
                            {(activeTab === 'all' || activeTab === 'studio') && studioResults.length > 0 && (
                                <section>
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">🏢 Estúdios <span className="text-sm font-normal text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-full">{studioResults.length}</span></h2>
                                    {renderGrid(studioResults, 'studio')}
                                </section>
                            )}

                            {/* No Results Fallback */}
                            {!loading && animeResults.length === 0 && characterResults.length === 0 && personResults.length === 0 && studioResults.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <Search className="w-16 h-16 text-text-secondary opacity-30 mb-6" />
                                    <h3 className="text-2xl font-bold text-text-primary mb-2">Nenhum resultado encontrado</h3>
                                    <p className="text-text-secondary">Não achamos nada para "{query}" nessa categoria.</p>
                                </div>
                            )}

                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-60">
                    <Search className="w-20 h-20 text-text-secondary mb-6" />
                    <h2 className="text-2xl font-bold text-text-primary">Pronto para buscar</h2>
                    <p className="text-lg text-text-secondary">Digite algo na barra de pesquisa acima para começar.</p>
                </div>
            )}
        </div>
    );
}
