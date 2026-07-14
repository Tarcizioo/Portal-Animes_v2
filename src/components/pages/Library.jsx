import { useState, useMemo, useEffect } from 'react';

import { useAnimeLibrary } from '@/hooks/useAnimeLibrary';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Filter, SlidersHorizontal, ChevronDown, Search, X, Trash2, Calendar, MonitorPlay, List, Library as LibraryIcon, RefreshCw, Sparkles, LayoutGrid } from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';

import { useToast } from '@/context/ToastContext';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { LibraryOverview } from '@/components/library/LibraryOverview';
import { ContinueWatching } from '@/components/library/ContinueWatching';
import { LibraryAnimeItem } from '@/components/library/LibraryAnimeItem';

const GENRES = [
    { id: 1, name: 'Ação' },
    { id: 2, name: 'Aventura' },
    { id: 4, name: 'Comédia' },
    { id: 8, name: 'Drama' },
    { id: 10, name: 'Fantasia' },
    { id: 14, name: 'Terror' },
    { id: 22, name: 'Romance' },
    { id: 24, name: 'Sci-Fi' },
    { id: 7, name: 'Mistério' },
    { id: 40, name: 'Psicológico' },
    { id: 18, name: 'Mecha' },
    { id: 19, name: 'Musical' },
    { id: 36, name: 'Slice of Life' },
    { id: 37, name: 'Sobrenatural' },
    { id: 30, name: 'Esportes' },
    { id: 41, name: 'Suspense' },
    { id: 23, name: 'Escolar' },
    { id: 42, name: 'Seinen' },
    { id: 27, name: 'Shounen' },
];

const GENRE_ID_MAP = {
    1: 'Action',
    2: 'Adventure',
    4: 'Comedy',
    8: 'Drama',
    10: 'Fantasy',
    14: 'Horror',
    22: 'Romance',
    24: 'Sci-Fi',
    7: 'Mystery',
    40: 'Psychological',
    18: 'Mecha',
    19: 'Music',
    36: 'Slice of Life',
    37: 'Supernatural',
    30: 'Sports',
    41: 'Suspense',
    56: 'School',
    57: 'Seinen',
    27: 'Shounen'
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const VIEW_OPTIONS = [
    { value: 'grid', label: '', icon: LayoutGrid, ariaLabel: 'Visualizar em grade' },
    { value: 'list', label: '', icon: List, ariaLabel: 'Visualizar em lista' },
];

const LIBRARY_STATUSES = [
    { value: '', label: 'Todos', color: 'bg-text-secondary' },
    { value: 'watching', label: 'Assistindo', color: 'bg-primary' },
    { value: 'completed', label: 'Completos', color: 'bg-emerald-500' },
    { value: 'plan_to_watch', label: 'Planejo assistir', color: 'bg-slate-400' },
    { value: 'paused', label: 'Pausados', color: 'bg-amber-500' },
    { value: 'dropped', label: 'Dropados', color: 'bg-red-500' },
];
export function Library() {
    const { library, loading, syncLibraryData, removeFromLibrary, incrementProgress, updateStatus } = useAnimeLibrary();
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // --- PERSISTÊNCIA DE VIEW MODE ---
    const [viewMode, setViewMode] = useState(() => {
        const saved = localStorage.getItem('anime_lib_view_mode');
        return saved || 'grid';
    });

    const [isSyncing, setIsSyncing] = useState(false);
    const { toast } = useToast();
    const [animeToRemove, setAnimeToRemove] = useState(null);

    const handleRemoveConfirm = async () => {
        if (animeToRemove) {
            try {
                await removeFromLibrary(animeToRemove.id);
                toast.success(`${animeToRemove.title} removido com sucesso.`);
            } catch {
                toast.error("Erro ao remover anime.");
            }
            setAnimeToRemove(null);
        }
    };

    usePageTitle('Minha Biblioteca');

    // Salva ViewMode quando mudar
    useEffect(() => {
        localStorage.setItem('anime_lib_view_mode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        if (!showMobileFilters) return undefined;

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setShowMobileFilters(false);
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [showMobileFilters]);

    const handleSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        toast.info("Iniciando sincronização de dados...");

        try {
            await syncLibraryData();
            toast.success("Biblioteca sincronizada com sucesso!");
        } catch {
            toast.error("Erro ao sincronizar dados.");
        } finally {
            setIsSyncing(false);
        }
    };

    // --- PERSISTÊNCIA DE FILTROS ---
    const [filters, setFilters] = useState(() => {
        const saved = localStorage.getItem('anime_lib_filters');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error("Erro ao ler filtros do localStorage", e);
            }
        }
        return {
            q: '',
            genres: [], // IDs numéricos
            orderBy: 'recent_updated',
            status: '',
            libraryStatus: '',
            year: '',
            season: '',
            type: '',
        };
    });

    // Salva Filtros quando mudar
    useEffect(() => {
        localStorage.setItem('anime_lib_filters', JSON.stringify(filters));
    }, [filters]);

    // --- LÓGICA DE FILTRAGEM ---
    const filteredLibrary = useMemo(() => {
        if (!library) return [];

        return library.filter(anime => {
            // 1. Busca por Texto (Título)
            if (filters.q && !anime.title.toLowerCase().includes(filters.q.toLowerCase())) {
                return false;
            }

            // 2. Status na Biblioteca (Plan to watch, Completed, etc)
            if (filters.libraryStatus && anime.status !== filters.libraryStatus) {
                return false;
            }

            // 3. Tipo (TV, Movie) - Case Insensitive
            if (filters.type) {
                const animeType = (anime.type || 'TV').toLowerCase();
                if (animeType !== filters.type.toLowerCase()) {
                    return false;
                }
            }

            // 4. Temporada (Inverno, Verão...)
            if (filters.season) {
                const animeSeason = (anime.season || '').toLowerCase();
                if (animeSeason !== filters.season.toLowerCase()) {
                    return false;
                }
            }

            // 5. Ano
            if (filters.year && anime.year !== parseInt(filters.year)) {
                return false;
            }

            // 6. Gêneros (Com mapeamento ID -> String)
            if (filters.genres.length > 0) {
                let animeGenres = [];

                if (Array.isArray(anime.genres)) {
                    // Novo formato: ['Action', 'Fantasy']
                    animeGenres = anime.genres;
                } else if (typeof anime.genres === 'string') {
                    // Formato antigo/Legacy
                    animeGenres = anime.genres.split(',').map(g => g.trim());
                }

                // Verifica se o anime possui ALGUM dos gêneros selecionados
                // Mapeia os IDs selecionados (e.g. 1) para strings (e.g. 'Action')
                const selectedGenreNames = filters.genres
                    .map(id => GENRE_ID_MAP[id])
                    .filter(Boolean); // Remove undefined

                const hasGenre = selectedGenreNames.some(filterGenreName => {
                    return animeGenres.some(animeGenre =>
                        animeGenre.toLowerCase().trim() === filterGenreName.toLowerCase().trim()
                    );
                });

                if (!hasGenre) return false;
            }

            return true;
        }).sort((a, b) => {
            // --- ORDENAÇÃO ---
            switch (filters.orderBy) {
                case 'score':
                    return (b.score || 0) - (a.score || 0);
                case 'title_asc':
                    return a.title.localeCompare(b.title);
                case 'title_desc':
                    return b.title.localeCompare(a.title);
                case 'recent_updated':
                    return (b.lastUpdated?.seconds || 0) - (a.lastUpdated?.seconds || 0);
                case 'oldest_updated':
                    return (a.lastUpdated?.seconds || 0) - (b.lastUpdated?.seconds || 0);
                case 'favorites':
                    return (b.isFavorite === true ? 1 : 0) - (a.isFavorite === true ? 1 : 0);
                default:
                    return 0;
            }
        });
    }, [library, filters]);

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            q: '',
            genres: [],
            orderBy: 'recent_updated',
            status: '',
            libraryStatus: '',
            year: '',
            season: '',
            type: '',
        });
    };

    const handleGenreToggle = (genreId) => {
        const currentGenres = filters.genres;
        if (currentGenres.includes(genreId)) {
            updateFilter('genres', currentGenres.filter(id => id !== genreId));
        } else {
            updateFilter('genres', [...currentGenres, genreId]);
        }
    };

    const hasActiveFilters = filters.q || filters.libraryStatus || filters.genres.length > 0 || filters.year || filters.season || filters.type;
    const activeFilterCount = [
        filters.q,
        filters.libraryStatus,
        filters.year,
        filters.season,
        filters.type,
        filters.genres.length > 0,
    ].filter(Boolean).length;
    const continueWatching = useMemo(() => (
        library
            .filter((anime) => anime.status === 'watching' && (!anime.totalEp || (anime.currentEp || 0) < anime.totalEp))
            .sort((a, b) => (b.lastUpdated?.seconds || 0) - (a.lastUpdated?.seconds || 0))
            .slice(0, 4)
    ), [library]);

    if (loading) {
        return (

            <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
                {/* Skeleton Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-bg-secondary rounded-xl"></div>
                        <div className="space-y-2">
                            <div className="h-8 w-64 bg-bg-secondary rounded-lg"></div>
                            <div className="h-5 w-96 bg-bg-secondary rounded-lg"></div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Skeleton Sidebar Filters */}
                    <div className="hidden lg:block w-72 space-y-8">
                        <div className="h-40 bg-bg-secondary rounded-2xl"></div>
                        <div className="h-20 bg-bg-secondary rounded-2xl"></div>
                        <div className="h-60 bg-bg-secondary rounded-2xl"></div>
                    </div>

                    {/* Skeleton Grid */}
                    <div className="flex-1">
                        <div className="h-16 bg-bg-secondary rounded-2xl mb-8 w-full"></div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {[...Array(12)].map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        );
    }

    return (

        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">

            <div className="mb-8 border-b border-border-color pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <LibraryIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-text-primary mb-2 tracking-tight">Minha Biblioteca</h1>
                        <p className="text-lg text-text-secondary">Gerencie suas séries, filmes e programe sua próxima maratona.</p>
                    </div>
                </div>

                {/* Botão de Sync */}
                <Motion.button
                    onClick={handleSync}
                    disabled={isSyncing}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${isSyncing
                        ? 'bg-bg-tertiary text-text-secondary border-transparent cursor-not-allowed'
                        : 'bg-bg-secondary hover:bg-bg-tertiary text-text-primary border-border-color hover:border-primary/50'}`}
                    title="Atualizar dados de animes antigos"
                >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Dados'}
                </Motion.button>
            </div>

            {library.length > 0 && (
                <>
                    <LibraryOverview library={library} />
                   <ContinueWatching animes={continueWatching} onIncrement={incrementProgress} />
                </>
            )}

            <div className="flex flex-col lg:flex-row gap-8">

                {/* --- SIDEBAR DE FILTROS --- */}
                <aside
                    role={showMobileFilters ? 'dialog' : undefined}
                    aria-modal={showMobileFilters ? 'true' : undefined}
                    aria-label={showMobileFilters ? 'Filtros da biblioteca' : undefined}
                    className={clsx(
                        "lg:w-72 flex-shrink-0 space-y-8 pb-24 lg:pb-0",
                        showMobileFilters ? "fixed inset-0 z-[60] bg-bg-secondary p-6 overflow-y-auto" : "hidden lg:block"
                    )}
                >
                    <div className="flex items-center justify-between lg:hidden mb-6 border-b border-border-color pb-4">
                        <h2 className="text-2xl font-bold text-text-primary">Filtros</h2>
                        <button type="button" onClick={() => setShowMobileFilters(false)} aria-label="Fechar filtros" className="p-2 bg-bg-tertiary rounded-full text-text-primary"><X /></button>
                    </div>

                    {/* Busca */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                            <Search className="w-4 h-4 text-button-accent" /> Pesquisar
                        </h3>
                        <div className="relative">
                            <input
                                type="text"
                                aria-label="Pesquisar na biblioteca"
                                value={filters.q}
                                placeholder="Buscar na biblioteca..."
                                className="w-full bg-bg-secondary border-2 border-border-color rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:border-button-accent focus:ring-4 focus:ring-button-accent/10 transition-all placeholder-text-secondary/60"
                                onChange={(e) => updateFilter('q', e.target.value)}
                            />
                            {filters.q && (
                                <button type="button" onClick={() => updateFilter('q', '')} aria-label="Limpar pesquisa" className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ano e Temporada (Grid 2 colunas como no Catalogo) */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Ano */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">  <Calendar className="w-3.5 h-3.5 text-button-accent" /> Ano </h3>
                            <select
                                aria-label="Filtrar por ano"
                                value={filters.year}
                                onChange={(e) => updateFilter('year', e.target.value)}
                                className="w-full bg-bg-secondary border-2 border-border-color rounded-xl px-2 py-2.5 text-sm text-text-primary focus:outline-none focus:border-button-accent focus:ring-2 focus:ring-button-accent/10 transition-all cursor-pointer appearance-none"
                            >
                                <option value="">Todos</option>
                                {Array.from({ length: 45 }, (_, i) => new Date().getFullYear() + 1 - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>

                        {/* Tempoarada */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2"> Temp. </h3>
                            <select
                                aria-label="Filtrar por temporada"
                                value={filters.season}
                                onChange={(e) => updateFilter('season', e.target.value)}
                                className="w-full bg-bg-secondary border-2 border-border-color rounded-xl px-2 py-2.5 text-sm text-text-primary focus:outline-none focus:border-button-accent focus:ring-2 focus:ring-button-accent/10 transition-all cursor-pointer appearance-none"
                            >
                                <option value="">Todas</option>
                                <option value="winter">Inverno</option>
                                <option value="spring">Primavera</option>
                                <option value="summer">Verão</option>
                                <option value="fall">Outono</option>
                            </select>
                        </div>
                    </div>

                    {/* Formato */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2"> <MonitorPlay className="w-3.5 h-3.5 text-button-accent" /> Formato </h3>
                        <select
                            aria-label="Filtrar por formato"
                            value={filters.type}
                            onChange={(e) => updateFilter('type', e.target.value)}
                            className="w-full bg-bg-secondary border-2 border-border-color rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-button-accent focus:ring-2 focus:ring-button-accent/10 transition-all cursor-pointer appearance-none"
                        >
                            <option value="">Todos</option>
                            <option value="TV">TV</option>
                            <option value="Movie">Filme</option>
                            <option value="OVA">OVA</option>
                            <option value="Special">Especial</option>
                            <option value="ONA">ONA</option>
                        </select>
                    </div>

                    {/* Gêneros */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                                <Filter className="w-4 h-4 text-button-accent" /> Gêneros
                            </h3>
                            {filters.genres.length > 0 && (
                                <span className="text-xs bg-button-accent text-text-on-primary font-bold px-2 py-0.5 rounded-full">{filters.genres.length}</span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {GENRES.map((g) => {
                                const isSelected = filters.genres.includes(g.id);
                                return (
                                    <Motion.button
                                        key={g.id}
                                        type="button"
                                        aria-pressed={isSelected}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleGenreToggle(g.id)}
                                        className={`
                            text-sm px-3 py-1.5 rounded-lg border transition-colors font-medium
                            ${isSelected
                                                ? 'bg-button-accent border-button-accent text-text-on-primary'
                                                : 'bg-bg-secondary border-border-color text-text-secondary hover:border-border-color/80 hover:text-text-primary'}
                        `}
                                    >
                                        {g.name}
                                    </Motion.button>
                                );
                            })}
                        </div>
                    </div>


                    {/* Botão Limpar */}
                    {hasActiveFilters && (
                        <Motion.button
                            type="button"
                            onClick={clearFilters}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors text-sm font-bold uppercase tracking-wider"
                        >
                            <Trash2 className="w-4 h-4" /> Limpar Filtros
                        </Motion.button>
                    )}

                    <div className="sticky -bottom-6 -mx-6 border-t border-border-color bg-bg-secondary/95 p-4 backdrop-blur-xl lg:hidden">
                        <button
                            type="button"
                            onClick={() => setShowMobileFilters(false)}
                            className="w-full rounded-xl bg-button-accent py-3.5 font-bold text-text-on-primary shadow-lg shadow-button-accent/20"
                        >
                            Ver {filteredLibrary.length} {filteredLibrary.length === 1 ? 'anime' : 'animes'}
                        </button>
                    </div>

                </aside>

                {/* --- ÁREA PRINCIPAL --- */}
                <div className="flex-1 min-w-0">

                    <div className="relative mb-4 lg:hidden">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
                        <input
                            type="search"
                            aria-label="Pesquisar na biblioteca"
                            value={filters.q}
                            onChange={(event) => updateFilter('q', event.target.value)}
                            placeholder="Buscar na biblioteca..."
                            className="w-full rounded-xl border-2 border-border-color bg-bg-secondary py-3 pl-11 pr-11 text-text-primary outline-none transition-all placeholder:text-text-secondary/60 focus:border-button-accent focus:ring-4 focus:ring-button-accent/10"
                        />
                        {filters.q && (
                            <button type="button" onClick={() => updateFilter('q', '')} aria-label="Limpar pesquisa" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="mb-8 overflow-hidden rounded-2xl border border-border-color bg-bg-secondary shadow-xl shadow-shadow-color/10">
                        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowMobileFilters(true)}
                                    aria-label="Abrir filtros"
                                    className="relative rounded-lg bg-button-accent p-2.5 text-text-on-primary shadow-lg shadow-button-accent/20 lg:hidden"
                                >
                                    <Filter className="h-5 w-5" />
                                    {activeFilterCount > 0 && (
                                        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-text-secondary">Sua coleção</p>
                                    <p className="mt-0.5 text-sm text-text-secondary"><strong className="text-lg text-text-primary">{filteredLibrary.length}</strong> animes encontrados</p>
                                </div>
                            </div>

                            <div className="flex w-full items-center gap-2 sm:w-auto">
                                <ViewToggle value={viewMode} onChange={setViewMode} options={VIEW_OPTIONS} />
                                <div className="relative min-w-0 flex-1 sm:flex-none">
                                    <label className="sr-only" htmlFor="library-order">Ordenar biblioteca</label>
                                    <select
                                        id="library-order"
                                        className="w-full appearance-none rounded-xl border-2 border-border-color bg-bg-tertiary py-2.5 pl-4 pr-11 text-sm font-medium text-text-primary transition-colors hover:bg-bg-primary focus:border-button-accent focus:outline-none focus:ring-2 focus:ring-button-accent/20 sm:w-auto"
                                        value={filters.orderBy}
                                        onChange={(event) => updateFilter('orderBy', event.target.value)}
                                    >
                                        <option value="recent_updated">Editados recentemente</option>
                                        <option value="oldest_updated">Editados há mais tempo</option>
                                        <option value="score">Minha nota</option>
                                        <option value="title_asc">Título (A-Z)</option>
                                        <option value="title_desc">Título (Z-A)</option>
                                        <option value="favorites">Favoritos primeiro</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-border-color bg-bg-primary/35 px-4 py-3 sm:px-5">
                            <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
                                <span className="flex flex-shrink-0 items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-text-secondary">
                                    <SlidersHorizontal className="h-3.5 w-3.5 text-button-accent" /> Status
                                </span>
                                <div className="h-5 w-px flex-shrink-0 bg-border-color" />
                                {LIBRARY_STATUSES.map((status) => {
                                    const isActive = filters.libraryStatus === status.value;
                                    return (
                                        <button
                                            type="button"
                                            key={status.value || 'all'}
                                            onClick={() => updateFilter('libraryStatus', status.value)}
                                            aria-pressed={isActive}
                                            className={`flex flex-shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${isActive ? 'border-button-accent bg-button-accent text-text-on-primary shadow-md shadow-button-accent/15' : 'border-border-color bg-bg-secondary text-text-secondary hover:border-button-accent/35 hover:text-text-primary'}`}
                                        >
                                            <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-current' : status.color}`} />
                                            {status.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    {/* Grid / List */}
                    <Motion.div
                        className={viewMode === 'grid'
                            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                            : "flex flex-col gap-4"
                        }
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        key={`${viewMode}-${JSON.stringify(filters)}-${filteredLibrary.length > 0}`}
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredLibrary.map((anime) => (
                                <Motion.div
                                    key={anime.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                    layout
                                >
                                    <LibraryAnimeItem
                                        anime={anime}
                                        viewMode={viewMode}
                                        onRemove={() => setAnimeToRemove(anime)}
                                        onIncrement={incrementProgress}
                                        onStatusChange={updateStatus}
                                    />
                                </Motion.div>
                            ))}
                        </AnimatePresence>
                    </Motion.div>

                    {filteredLibrary.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-bg-secondary rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <Search className="w-10 h-10 text-text-secondary" />
                            </div>
                            <h3 className="text-2xl font-bold text-text-primary mb-2">Nenhum anime encontrado</h3>
                            <p className="text-text-secondary mb-6">
                                {hasActiveFilters
                                    ? "Tente ajustar seus filtros para encontrar o que procura."
                                    : "Sua biblioteca está vazia. Explore o catálogo para adicionar animes!"
                                }
                            </p>
                            {hasActiveFilters ? (
                                <Motion.button
                                    onClick={clearFilters}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-6 py-3 bg-button-accent hover:bg-button-accent/90 text-text-on-primary rounded-xl font-bold transition-all shadow-lg"
                                >
                                    Limpar filtros
                                </Motion.button>
                            ) : (
                                <Link
                                    to="/catalog"
                                    className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-lg"
                                >
                                    Ir para o Catálogo
                                </Link>
                            )}
                        </div>
                    )}

                </div>

            </div>

            {/* Remove Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!animeToRemove}
                onClose={() => setAnimeToRemove(null)}
                onConfirm={handleRemoveConfirm}
                title="Remover da Biblioteca"
                message={`Tem certeza que deseja remover "${animeToRemove?.title}" da sua biblioteca?`}
                confirmText="Remover"
                isDestructive
            />
        </div>

    );
}
