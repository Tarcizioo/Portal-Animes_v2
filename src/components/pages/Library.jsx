import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
    Calendar,
    Filter,
    LayoutGrid,
    Library as LibraryIcon,
    List,
    MonitorPlay,
    RefreshCw,
    Search,
    SlidersHorizontal,
    Trash2,
    WifiOff,
    X,
} from 'lucide-react';

import { ContinueWatching } from '@/components/library/ContinueWatching';
import { LibraryAnimeItem } from '@/components/library/LibraryAnimeItem';
import { LibraryOverview } from '@/components/library/LibraryOverview';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { LIBRARY_GENRE_ID_MAP } from '@/constants/libraryGenres';
import { useToast } from '@/context/ToastContext';
import { useAnimeLibrary } from '@/hooks/useAnimeLibrary';
import { usePageTitle } from '@/hooks/usePageTitle';

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

const LIBRARY_STATUSES = [
    { value: '', label: 'Todos', color: 'bg-text-secondary' },
    { value: 'watching', label: 'Assistindo', color: 'bg-primary' },
    { value: 'completed', label: 'Concluídos', color: 'bg-emerald-500' },
    { value: 'plan_to_watch', label: 'Planejados', color: 'bg-slate-400' },
    { value: 'paused', label: 'Pausados', color: 'bg-amber-500' },
    { value: 'dropped', label: 'Dropados', color: 'bg-red-500' },
];

const VIEW_OPTIONS = [
    { value: 'grid', label: '', icon: LayoutGrid, ariaLabel: 'Visualizar em grade' },
    { value: 'list', label: '', icon: List, ariaLabel: 'Visualizar em lista' },
];

const ORDER_OPTIONS = [
    { value: 'recent_updated', label: 'Editados recentemente' },
    { value: 'oldest_updated', label: 'Editados há mais tempo' },
    { value: 'score', label: 'Minha nota' },
    { value: 'title_asc', label: 'Título (A–Z)' },
    { value: 'title_desc', label: 'Título (Z–A)' },
    { value: 'favorites', label: 'Favoritos primeiro' },
];

const YEAR_OPTIONS = Array.from(
    { length: 45 },
    (_, index) => new Date().getFullYear() + 1 - index,
);

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const createDefaultFilters = () => ({
    q: '',
    genres: [],
    orderBy: 'recent_updated',
    libraryStatus: '',
    year: '',
    season: '',
    type: '',
});

const readSavedFilters = () => {
    const defaults = createDefaultFilters();
    const saved = localStorage.getItem('anime_lib_filters');
    if (!saved) return defaults;

    try {
        const parsed = JSON.parse(saved);
        return {
            q: typeof parsed.q === 'string' ? parsed.q : defaults.q,
            genres: Array.isArray(parsed.genres) ? parsed.genres : defaults.genres,
            orderBy: ORDER_OPTIONS.some((option) => option.value === parsed.orderBy) ? parsed.orderBy : defaults.orderBy,
            libraryStatus: LIBRARY_STATUSES.some((status) => status.value === parsed.libraryStatus) ? parsed.libraryStatus : defaults.libraryStatus,
            year: typeof parsed.year === 'string' ? parsed.year : defaults.year,
            season: typeof parsed.season === 'string' ? parsed.season : defaults.season,
            type: typeof parsed.type === 'string' ? parsed.type : defaults.type,
        };
    } catch (error) {
        console.error('Erro ao ler filtros da biblioteca', error);
        return defaults;
    }
};

const fieldClassName = 'min-h-11 w-full rounded-xl border-2 border-border-color bg-bg-tertiary px-3 py-2.5 text-sm font-medium text-text-primary outline-none transition-colors focus:border-button-accent focus:ring-2 focus:ring-button-accent';

function AdvancedFiltersContent({
    idPrefix,
    filters,
    updateFilter,
    onGenreToggle,
    onClear,
    hasActiveFilters,
}) {
    return (
        <div className="space-y-6">
            <section aria-labelledby={`${idPrefix}-order-title`} className="space-y-2">
                <h3 id={`${idPrefix}-order-title`} className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-text-secondary">
                    <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-button-accent" /> Ordenação
                </h3>
                <select
                    aria-label="Ordenar biblioteca"
                    value={filters.orderBy}
                    onChange={(event) => updateFilter('orderBy', event.target.value)}
                    className={fieldClassName}
                >
                    {ORDER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
            </section>

            <div className="grid grid-cols-2 gap-3">
                <section aria-labelledby={`${idPrefix}-year-title`} className="min-w-0 space-y-2">
                    <h3 id={`${idPrefix}-year-title`} className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-text-secondary">
                        <Calendar aria-hidden="true" className="h-4 w-4 text-button-accent" /> Ano
                    </h3>
                    <select aria-label="Filtrar por ano" value={filters.year} onChange={(event) => updateFilter('year', event.target.value)} className={fieldClassName}>
                        <option value="">Todos</option>
                        {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                </section>

                <section aria-labelledby={`${idPrefix}-season-title`} className="min-w-0 space-y-2">
                    <h3 id={`${idPrefix}-season-title`} className="text-xs font-black uppercase tracking-[0.14em] text-text-secondary">Temporada</h3>
                    <select aria-label="Filtrar por temporada" value={filters.season} onChange={(event) => updateFilter('season', event.target.value)} className={fieldClassName}>
                        <option value="">Todas</option>
                        <option value="winter">Inverno</option>
                        <option value="spring">Primavera</option>
                        <option value="summer">Verão</option>
                        <option value="fall">Outono</option>
                    </select>
                </section>
            </div>

            <section aria-labelledby={`${idPrefix}-format-title`} className="space-y-2">
                <h3 id={`${idPrefix}-format-title`} className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-text-secondary">
                    <MonitorPlay aria-hidden="true" className="h-4 w-4 text-button-accent" /> Formato
                </h3>
                <select aria-label="Filtrar por formato" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)} className={fieldClassName}>
                    <option value="">Todos</option>
                    <option value="TV">TV</option>
                    <option value="Movie">Filme</option>
                    <option value="OVA">OVA</option>
                    <option value="Special">Especial</option>
                    <option value="ONA">ONA</option>
                </select>
            </section>

            <section aria-labelledby={`${idPrefix}-genres-title`} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <h3 id={`${idPrefix}-genres-title`} className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-text-secondary">
                        <Filter aria-hidden="true" className="h-4 w-4 text-button-accent" /> Gêneros
                    </h3>
                    {filters.genres.length > 0 && <span className="rounded-full bg-button-accent px-2 py-0.5 text-xs font-bold text-text-on-primary">{filters.genres.length}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                    {GENRES.map((genre) => {
                        const isSelected = filters.genres.includes(genre.id);
                        return (
                            <button
                                key={genre.id}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => onGenreToggle(genre.id)}
                                className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-button-accent ${isSelected ? 'border-button-accent bg-button-accent text-text-on-primary' : 'border-border-color bg-bg-secondary text-text-secondary hover:border-button-accent hover:text-text-primary'}`}
                            >
                                {genre.name}
                            </button>
                        );
                    })}
                </div>
            </section>

            {hasActiveFilters && (
                <button
                    type="button"
                    onClick={onClear}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                    <Trash2 aria-hidden="true" className="h-4 w-4" /> Limpar filtros avançados
                </button>
            )}
        </div>
    );
}

function MobileFilterSheet({
    isOpen,
    onClose,
    filters,
    updateFilter,
    onGenreToggle,
    onClear,
    hasActiveFilters,
    resultCount,
}) {
    const dialogRef = useRef(null);
    const closeButtonRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== 'Tab') return;

            const focusable = [...(dialogRef.current?.querySelectorAll('button:not([disabled]), select:not([disabled]), input:not([disabled]), [href]') || [])];
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
        };
    }, [isOpen, onClose]);

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-end bg-black/70 backdrop-blur-sm lg:hidden"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="mobile-library-filters-title"
                className="flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[2rem] border border-border-color bg-bg-secondary shadow-[0_-24px_70px_rgba(0,0,0,0.55)]"
            >
                <div className="flex-shrink-0 border-b border-border-color bg-bg-secondary px-4 pb-3 pt-2">
                    <span aria-hidden="true" className="mx-auto mb-2 block h-1 w-12 rounded-full bg-zinc-500/40" />
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Refine sua coleção</p>
                            <h2 id="mobile-library-filters-title" className="text-xl font-black text-text-primary">Filtros avançados</h2>
                        </div>
                        <button
                            ref={closeButtonRef}
                            type="button"
                            onClick={onClose}
                            aria-label="Fechar filtros avançados"
                            className="grid h-11 w-11 place-items-center rounded-full border border-border-color bg-bg-tertiary p-0 text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <X aria-hidden="true" className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5">
                    <AdvancedFiltersContent
                        idPrefix="mobile-library"
                        filters={filters}
                        updateFilter={updateFilter}
                        onGenreToggle={onGenreToggle}
                        onClear={onClear}
                        hasActiveFilters={hasActiveFilters}
                    />
                </div>

                <div className="flex-shrink-0 border-t border-border-color bg-bg-secondary px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-12 w-full rounded-full bg-button-accent px-5 py-3 text-sm font-black text-text-on-primary shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary"
                    >
                        Ver {resultCount} {resultCount === 1 ? 'anime' : 'animes'}
                    </button>
                </div>
            </section>
        </div>,
        document.body,
    );
}

function LibraryLoading() {
    return (
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-10" role="status" aria-label="Carregando biblioteca">
            <div className="mb-6 flex animate-pulse items-center gap-3 sm:mb-8">
                <div className="h-11 w-11 rounded-xl bg-bg-secondary sm:h-14 sm:w-14" />
                <div className="space-y-2">
                    <div className="h-7 w-48 rounded-lg bg-bg-secondary sm:w-64" />
                    <div className="h-4 w-64 max-w-[70vw] rounded-lg bg-bg-secondary sm:w-96" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {[...Array(8)].map((_, index) => <SkeletonCard key={index} />)}
            </div>
            <span className="sr-only">Carregando sua coleção de animes</span>
        </div>
    );
}

function LibraryError({ onRetry }) {
    return (
        <section
            role="alert"
            aria-labelledby="library-error-title"
            className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center p-6 text-center"
        >
            <span aria-hidden="true" className="grid h-20 w-20 place-items-center rounded-3xl border border-red-500/20 bg-red-500/10 text-red-400">
                <WifiOff className="h-9 w-9" />
            </span>
            <h1 id="library-error-title" className="mt-6 text-2xl font-black tracking-tight text-text-primary">
                Não foi possível carregar sua biblioteca
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
                Seus dados continuam salvos. Confira a conexão e tente novamente.
            </p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
            >
                <RefreshCw aria-hidden="true" className="h-4 w-4" /> Tentar novamente
            </button>
        </section>
    );
}

function EmptyLibrary() {
    return (
        <section className="mx-auto flex max-w-lg flex-col items-center justify-center py-16 text-center sm:py-24" aria-labelledby="empty-library-title">
            <span aria-hidden="true" className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-bg-secondary shadow-inner">
                <LibraryIcon className="h-9 w-9 text-primary" />
            </span>
            <h2 id="empty-library-title" className="text-2xl font-black text-text-primary">Sua biblioteca está vazia</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">Descubra animes e adicione os que você quer acompanhar.</p>
            <Link to="/discover" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary">
                Explorar animes
            </Link>
        </section>
    );
}

export function Library() {
    const {
        library,
        loading,
        error,
        retry,
        syncLibraryData,
        removeFromLibrary,
        incrementProgress,
        updateStatus,
    } = useAnimeLibrary();
    const { toast } = useToast();
    const removalInFlightRef = useRef(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [animeToRemove, setAnimeToRemove] = useState(null);
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('anime_lib_view_mode') || 'grid');
    const [filters, setFilters] = useState(readSavedFilters);

    usePageTitle('Minha Biblioteca');

    useEffect(() => {
        localStorage.setItem('anime_lib_view_mode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        localStorage.setItem('anime_lib_filters', JSON.stringify(filters));
    }, [filters]);

    const closeMobileFilters = useCallback(() => setShowMobileFilters(false), []);
    const updateFilter = useCallback((key, value) => {
        setFilters((current) => ({ ...current, [key]: value }));
    }, []);

    const handleGenreToggle = useCallback((genreId) => {
        setFilters((current) => ({
            ...current,
            genres: current.genres.includes(genreId)
                ? current.genres.filter((id) => id !== genreId)
                : [...current.genres, genreId],
        }));
    }, []);

    const clearFilters = useCallback(() => setFilters(createDefaultFilters()), []);
    const clearAdvancedFilters = useCallback(() => {
        setFilters((current) => ({
            ...current,
            genres: [],
            orderBy: 'recent_updated',
            year: '',
            season: '',
            type: '',
        }));
    }, []);

    const filteredLibrary = useMemo(() => {
        const normalizedQuery = filters.q.trim().toLocaleLowerCase('pt-BR');
        return (library || []).filter((anime) => {
            if (normalizedQuery && !(anime.title || '').toLocaleLowerCase('pt-BR').includes(normalizedQuery)) return false;
            if (filters.libraryStatus && anime.status !== filters.libraryStatus) return false;
            if (filters.type && (anime.type || 'TV').toLocaleLowerCase('pt-BR') !== filters.type.toLocaleLowerCase('pt-BR')) return false;
            if (filters.season && (anime.season || '').toLocaleLowerCase('pt-BR') !== filters.season.toLocaleLowerCase('pt-BR')) return false;
            if (filters.year && anime.year !== Number(filters.year)) return false;

            if (filters.genres.length > 0) {
                const animeGenres = Array.isArray(anime.genres)
                    ? anime.genres
                    : typeof anime.genres === 'string' ? anime.genres.split(',').map((genre) => genre.trim()) : [];
                const selectedGenres = filters.genres.map((id) => LIBRARY_GENRE_ID_MAP[id]).filter(Boolean);
                const hasSelectedGenre = selectedGenres.some((selectedGenre) => animeGenres.some((animeGenre) => (
                    animeGenre.toLocaleLowerCase('pt-BR').trim() === selectedGenre.toLocaleLowerCase('pt-BR').trim()
                )));
                if (!hasSelectedGenre) return false;
            }
            return true;
        }).sort((first, second) => {
            switch (filters.orderBy) {
                case 'score': return (second.score || 0) - (first.score || 0);
                case 'title_asc': return first.title.localeCompare(second.title, 'pt-BR');
                case 'title_desc': return second.title.localeCompare(first.title, 'pt-BR');
                case 'oldest_updated': return (first.lastUpdated?.seconds || 0) - (second.lastUpdated?.seconds || 0);
                case 'favorites': return Number(second.isFavorite === true) - Number(first.isFavorite === true);
                case 'recent_updated':
                default: return (second.lastUpdated?.seconds || 0) - (first.lastUpdated?.seconds || 0);
            }
        });
    }, [filters, library]);

    const continueWatching = useMemo(() => (
        (library || [])
            .filter((anime) => anime.status === 'watching' && (!anime.totalEp || (anime.currentEp || 0) < anime.totalEp))
            .sort((first, second) => (second.lastUpdated?.seconds || 0) - (first.lastUpdated?.seconds || 0))
            .slice(0, 4)
    ), [library]);

    const advancedFilterCount = [
        filters.genres.length > 0,
        filters.year,
        filters.season,
        filters.type,
        filters.orderBy !== 'recent_updated',
    ].filter(Boolean).length;
    const hasActiveAdvancedFilters = advancedFilterCount > 0;
    const hasResultFilters = Boolean(filters.q || filters.libraryStatus || filters.genres.length > 0 || filters.year || filters.season || filters.type);

    const handleSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        toast.info('Iniciando sincronização de dados...');
        try {
            await syncLibraryData();
            toast.success('Biblioteca sincronizada com sucesso!');
        } catch {
            toast.error('Erro ao sincronizar dados.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleRemoveConfirm = async () => {
        if (!animeToRemove || removalInFlightRef.current) return;
        removalInFlightRef.current = true;
        try {
            await removeFromLibrary(animeToRemove.id);
        } catch {
            return;
        } finally {
            removalInFlightRef.current = false;
        }
        setAnimeToRemove(null);
    };

    const closeRemoveConfirmation = () => {
        if (!removalInFlightRef.current) setAnimeToRemove(null);
    };

    if (loading) return <LibraryLoading />;
    if (error) return <LibraryError onRetry={retry} />;

    return (
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-10">
            <header className="mb-6 flex items-start justify-between gap-3 border-b border-border-color pb-5 sm:mb-8 sm:items-center sm:gap-4 sm:pb-6">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-bg-tertiary text-primary sm:h-14 sm:w-14">
                        <LibraryIcon className="h-5 w-5 sm:h-8 sm:w-8" />
                    </span>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl lg:text-4xl">Minha Biblioteca</h1>
                        <p className="mt-1 text-sm text-text-secondary sm:text-base">Organize seus animes e acompanhe cada episódio.</p>
                    </div>
                </div>

                {library.length > 0 && (
                    <button
                        type="button"
                        onClick={handleSync}
                        disabled={isSyncing}
                        aria-busy={isSyncing}
                        aria-label={isSyncing ? 'Sincronizando dados da biblioteca' : 'Sincronizar dados da biblioteca'}
                        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border-color bg-bg-secondary px-3 py-2 text-sm font-bold text-text-primary transition-colors hover:border-primary hover:bg-bg-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-wait disabled:opacity-60 sm:px-4"
                    >
                        <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
                    </button>
                )}
            </header>

            {library.length === 0 ? (
                <EmptyLibrary />
            ) : (
                <>
                    <LibraryOverview library={library} />
                    <div className="[&_button]:min-h-11 [&_button]:min-w-11">
                        <ContinueWatching animes={continueWatching} onIncrement={incrementProgress} />
                    </div>

                    <div className="flex flex-col gap-8 lg:flex-row">
                        <aside aria-label="Filtros avançados" className="hidden w-72 shrink-0 lg:block">
                            <div className="sticky top-24 rounded-2xl border border-border-color bg-bg-secondary p-5 shadow-lg shadow-black/5">
                                <div className="mb-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Refine sua coleção</p>
                                    <h2 className="mt-1 text-lg font-black text-text-primary">Filtros avançados</h2>
                                </div>
                                <AdvancedFiltersContent
                                    idPrefix="desktop-library"
                                    filters={filters}
                                    updateFilter={updateFilter}
                                    onGenreToggle={handleGenreToggle}
                                    onClear={clearAdvancedFilters}
                                    hasActiveFilters={hasActiveAdvancedFilters}
                                />
                            </div>
                        </aside>

                        <div className="min-w-0 flex-1">
                            <div className="relative mb-3">
                                <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                                <input
                                    type="search"
                                    aria-label="Pesquisar na biblioteca"
                                    value={filters.q}
                                    onChange={(event) => updateFilter('q', event.target.value)}
                                    placeholder="Buscar na biblioteca..."
                                    className="min-h-12 w-full rounded-2xl border-2 border-border-color bg-bg-secondary py-3 pl-12 pr-12 text-base text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-button-accent focus:ring-2 focus:ring-button-accent"
                                />
                                {filters.q && (
                                    <button
                                        type="button"
                                        onClick={() => updateFilter('q', '')}
                                        aria-label="Limpar pesquisa"
                                        className="absolute right-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl bg-transparent p-0 text-text-secondary hover:bg-bg-tertiary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    >
                                        <X aria-hidden="true" className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <section aria-label="Controles da coleção" className="mb-6 overflow-hidden rounded-2xl border border-border-color bg-bg-secondary shadow-lg shadow-black/5">
                                <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
                                    <p aria-live="polite" className="min-w-0 text-sm text-text-secondary">
                                        <strong className="text-lg text-text-primary">{filteredLibrary.length}</strong> {filteredLibrary.length === 1 ? 'anime encontrado' : 'animes encontrados'}
                                    </p>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowMobileFilters(true)}
                                            aria-label="Abrir filtros avançados"
                                            aria-haspopup="dialog"
                                            aria-expanded={showMobileFilters}
                                            className="relative grid h-11 w-11 place-items-center rounded-full border border-border-color bg-bg-tertiary p-0 text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
                                        >
                                            <Filter aria-hidden="true" className="h-5 w-5" />
                                            {advancedFilterCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-button-accent px-1 text-[10px] font-black text-text-on-primary">{advancedFilterCount}</span>}
                                        </button>
                                        <div className="[&_button]:min-h-11 [&_button]:min-w-11">
                                            <ViewToggle value={viewMode} onChange={setViewMode} options={VIEW_OPTIONS} />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-border-color bg-bg-primary px-3 py-2.5 sm:px-4">
                                    <div role="group" aria-label="Filtrar por status" className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                        <span aria-hidden="true" className="flex shrink-0 items-center gap-2 pr-1 text-[10px] font-black uppercase tracking-[0.15em] text-text-secondary">
                                            <SlidersHorizontal className="h-3.5 w-3.5 text-button-accent" /> Status
                                        </span>
                                        {LIBRARY_STATUSES.map((status) => {
                                            const isActive = filters.libraryStatus === status.value;
                                            return (
                                                <button
                                                    type="button"
                                                    key={status.value || 'all'}
                                                    onClick={() => updateFilter('libraryStatus', status.value)}
                                                    aria-pressed={isActive}
                                                    className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isActive ? 'border-button-accent bg-button-accent text-text-on-primary' : 'border-border-color bg-bg-secondary text-text-secondary hover:border-button-accent hover:text-text-primary'}`}
                                                >
                                                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${isActive ? 'bg-current' : status.color}`} />
                                                    {status.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>

                            {filteredLibrary.length > 0 ? (
                                <Motion.div
                                    className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'flex flex-col gap-4'}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <AnimatePresence mode="popLayout">
                                        {filteredLibrary.map((anime) => (
                                            <Motion.div key={anime.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.22 }} layout>
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
                            ) : (
                                <section className="flex flex-col items-center justify-center py-16 text-center" aria-labelledby="empty-filter-title">
                                    <span aria-hidden="true" className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-bg-secondary shadow-inner"><Search className="h-9 w-9 text-text-secondary" /></span>
                                    <h2 id="empty-filter-title" className="text-2xl font-black text-text-primary">Nenhum anime corresponde aos filtros</h2>
                                    <p className="mt-2 max-w-sm text-sm text-text-secondary">Ajuste a busca, o status ou os filtros avançados para ver outros resultados.</p>
                                    {hasResultFilters && (
                                        <button type="button" onClick={clearFilters} className="mt-6 min-h-11 rounded-full bg-button-accent px-6 py-3 text-sm font-bold text-text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                            Limpar todos os filtros
                                        </button>
                                    )}
                                </section>
                            )}
                        </div>
                    </div>
                </>
            )}

            <MobileFilterSheet
                isOpen={showMobileFilters}
                onClose={closeMobileFilters}
                filters={filters}
                updateFilter={updateFilter}
                onGenreToggle={handleGenreToggle}
                onClear={clearAdvancedFilters}
                hasActiveFilters={hasActiveAdvancedFilters}
                resultCount={filteredLibrary.length}
            />

            <ConfirmationModal
                isOpen={Boolean(animeToRemove)}
                onClose={closeRemoveConfirmation}
                onConfirm={handleRemoveConfirm}
                title="Remover da Biblioteca"
                message={`Tem certeza que deseja remover "${animeToRemove?.title}" da sua biblioteca?`}
                confirmText="Remover"
                isDestructive
            />
        </div>
    );
}
