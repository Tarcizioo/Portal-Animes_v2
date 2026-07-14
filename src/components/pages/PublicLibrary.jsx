import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import {
    Filter, SlidersHorizontal, ChevronDown, Search, X, Trash2,
    Calendar, MonitorPlay, List, LayoutGrid, ArrowLeft, Library as LibraryIcon
} from 'lucide-react';

import { usePublicProfile } from '@/hooks/usePublicProfile';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AnimeCard } from '@/components/ui/AnimeCard';
import { AnimeListItem } from '@/components/ui/AnimeListItem';
import { ViewToggle } from '@/components/ui/ViewToggle';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { Skeleton } from '@/components/ui/Skeleton';

// ─── Genre config (mirrored from Library.jsx) ─────────────────────────────────
const GENRES = [
    { id: 1, name: 'Ação' }, { id: 2, name: 'Aventura' }, { id: 4, name: 'Comédia' },
    { id: 8, name: 'Drama' }, { id: 10, name: 'Fantasia' }, { id: 14, name: 'Terror' },
    { id: 22, name: 'Romance' }, { id: 24, name: 'Sci-Fi' }, { id: 7, name: 'Mistério' },
    { id: 40, name: 'Psicológico' }, { id: 18, name: 'Mecha' }, { id: 19, name: 'Musical' },
    { id: 36, name: 'Slice of Life' }, { id: 37, name: 'Sobrenatural' }, { id: 30, name: 'Esportes' },
    { id: 41, name: 'Suspense' }, { id: 23, name: 'Escolar' }, { id: 42, name: 'Seinen' },
    { id: 27, name: 'Shounen' },
];

const GENRE_ID_MAP = {
    1: 'Action', 2: 'Adventure', 4: 'Comedy', 8: 'Drama', 10: 'Fantasy',
    14: 'Horror', 22: 'Romance', 24: 'Sci-Fi', 7: 'Mystery', 40: 'Psychological',
    18: 'Mecha', 19: 'Music', 36: 'Slice of Life', 37: 'Supernatural',
    30: 'Sports', 41: 'Suspense', 56: 'School', 57: 'Seinen', 27: 'Shounen'
};

const STATUS_LIST = [
    { val: 'watching',     label: 'Assistindo',       color: 'bg-green-500' },
    { val: 'completed',    label: 'Completos',         color: 'bg-blue-500' },
    { val: 'plan_to_watch',label: 'Planejo Assistir',  color: 'bg-gray-500' },
    { val: 'dropped',      label: 'Dropados',          color: 'bg-red-500' },
    { val: 'paused',       label: 'Pausados',          color: 'bg-yellow-500' },
];

const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

export function PublicLibrary() {
    const { uid } = useParams();
    const { profile, library, loading, error } = usePublicProfile(uid);

    usePageTitle(profile ? `Biblioteca de ${profile.displayName}` : 'Biblioteca Pública');

    // ── View mode ────────────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState('grid');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // ── Filters ──────────────────────────────────────────────────────────────
    const [filters, setFilters] = useState({
        q: '',
        genres: [],
        orderBy: 'recent_updated',
        libraryStatus: '',
        year: '',
        season: '',
        type: '',
    });

    const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
    const clearFilters = () => setFilters({
        q: '', genres: [], orderBy: 'recent_updated',
        libraryStatus: '', year: '', season: '', type: '',
    });

    const handleGenreToggle = (genreId) => {
        const cur = filters.genres;
        updateFilter('genres', cur.includes(genreId) ? cur.filter(id => id !== genreId) : [...cur, genreId]);
    };

    // ── Filtered + sorted list ────────────────────────────────────────────────
    const filteredLibrary = useMemo(() => {
        if (!library) return [];

        return library.filter(anime => {
            if (filters.q && !anime.title.toLowerCase().includes(filters.q.toLowerCase())) return false;
            if (filters.libraryStatus && anime.status !== filters.libraryStatus) return false;
            if (filters.type) {
                const t = (anime.type || 'TV').toLowerCase();
                if (t !== filters.type.toLowerCase()) return false;
            }
            if (filters.season) {
                const s = (anime.season || '').toLowerCase();
                if (s !== filters.season.toLowerCase()) return false;
            }
            if (filters.year && anime.year !== parseInt(filters.year)) return false;
            if (filters.genres.length > 0) {
                let animeGenres = [];
                if (Array.isArray(anime.genres)) animeGenres = anime.genres;
                else if (typeof anime.genres === 'string') animeGenres = anime.genres.split(',').map(g => g.trim());
                const selectedNames = filters.genres.map(id => GENRE_ID_MAP[id]).filter(Boolean);
                const hasGenre = selectedNames.some(fn =>
                    animeGenres.some(ag => ag.toLowerCase().trim() === fn.toLowerCase().trim())
                );
                if (!hasGenre) return false;
            }
            return true;
        }).sort((a, b) => {
            switch (filters.orderBy) {
                case 'score':           return (Number(b.score) || 0) - (Number(a.score) || 0);
                case 'title_asc':       return a.title.localeCompare(b.title);
                case 'title_desc':      return b.title.localeCompare(a.title);
                case 'oldest_updated':  return (a.lastUpdated?.seconds || 0) - (b.lastUpdated?.seconds || 0);
                case 'favorites':       return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
                default:                return (b.lastUpdated?.seconds || 0) - (a.lastUpdated?.seconds || 0);
            }
        });
    }, [library, filters]);

    const hasActiveFilters = filters.q || filters.libraryStatus || filters.genres.length > 0 || filters.year || filters.season || filters.type;

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-bg-secondary rounded-xl" />
                        <div className="space-y-2">
                            <div className="h-8 w-64 bg-bg-secondary rounded-lg" />
                            <div className="h-5 w-96 bg-bg-secondary rounded-lg" />
                        </div>
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="hidden lg:block w-72 space-y-8">
                        <div className="h-40 bg-bg-secondary rounded-2xl" />
                        <div className="h-20 bg-bg-secondary rounded-2xl" />
                        <div className="h-60 bg-bg-secondary rounded-2xl" />
                    </div>
                    <div className="flex-1">
                        <div className="h-16 bg-bg-secondary rounded-2xl mb-8 w-full" />
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Error / not found ─────────────────────────────────────────────────────
    if (error || !profile) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6 text-center">
                <LibraryIcon className="w-16 h-16 text-text-secondary opacity-30" />
                <h2 className="text-3xl font-bold text-text-primary">Biblioteca indisponível</h2>
                <p className="text-text-secondary">{error || 'Este perfil não foi encontrado.'}</p>
                <Link to="/" className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
                    Voltar ao início
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="mb-8 border-b border-border-color pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <LibraryIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-text-primary mb-1 tracking-tight">
                            Biblioteca de{' '}
                            <span className="text-primary">{profile.displayName}</span>
                        </h1>
                        <p className="text-lg text-text-secondary">
                            {library.length} anime{library.length !== 1 ? 's' : ''} na coleção
                        </p>
                    </div>
                </div>

                <Link
                    to={`/u/${uid}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-border-color bg-bg-secondary hover:bg-bg-tertiary hover:border-primary/50 text-text-primary transition-all"
                >
                    <ArrowLeft className="w-4 h-4" /> Ver Perfil
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">

                {/* ── Sidebar Filtros ─────────────────────────────────────────── */}
                <aside className={clsx(
                    'lg:w-72 flex-shrink-0 space-y-8',
                    showMobileFilters
                        ? 'fixed inset-0 z-[60] bg-bg-secondary p-6 overflow-y-auto'
                        : 'hidden lg:block'
                )}>
                    {/* Mobile header */}
                    <div className="flex items-center justify-between lg:hidden mb-6 border-b border-border-color pb-4">
                        <h2 className="text-2xl font-bold text-text-primary">Filtros</h2>
                        <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-bg-tertiary rounded-full text-text-primary">
                            <X />
                        </button>
                    </div>

                    {/* Status */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-button-accent" /> Status
                        </h3>
                        <div className="flex flex-col gap-2">
                            {STATUS_LIST.map(st => (
                                <motion.button
                                    key={st.val}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                    onClick={() => updateFilter('libraryStatus', filters.libraryStatus === st.val ? '' : st.val)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors border-2 w-full text-left ${
                                        filters.libraryStatus === st.val
                                            ? 'bg-bg-secondary border-button-accent text-text-primary shadow-lg'
                                            : 'bg-bg-secondary/50 border-transparent hover:bg-bg-secondary hover:border-border-color text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    <div className={`w-3 h-3 rounded-full ${st.color}`} />
                                    <span className="font-medium">{st.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Busca */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                            <Search className="w-4 h-4 text-button-accent" /> Pesquisar
                        </h3>
                        <div className="relative">
                            <input
                                type="text"
                                value={filters.q}
                                placeholder="Buscar na biblioteca..."
                                className="w-full bg-bg-secondary border-2 border-border-color rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:border-button-accent focus:ring-4 focus:ring-button-accent/10 transition-all placeholder-text-secondary/60"
                                onChange={e => updateFilter('q', e.target.value)}
                            />
                            {filters.q && (
                                <button onClick={() => updateFilter('q', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ano + Temporada */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-button-accent" /> Ano
                            </h3>
                            <select
                                value={filters.year}
                                onChange={e => updateFilter('year', e.target.value)}
                                className="w-full bg-bg-secondary border-2 border-border-color rounded-xl px-2 py-2.5 text-sm text-text-primary focus:outline-none focus:border-button-accent transition-all cursor-pointer appearance-none"
                            >
                                <option value="">Todos</option>
                                {Array.from({ length: 45 }, (_, i) => new Date().getFullYear() + 1 - i).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Temp.</h3>
                            <select
                                value={filters.season}
                                onChange={e => updateFilter('season', e.target.value)}
                                className="w-full bg-bg-secondary border-2 border-border-color rounded-xl px-2 py-2.5 text-sm text-text-primary focus:outline-none focus:border-button-accent transition-all cursor-pointer appearance-none"
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
                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                            <MonitorPlay className="w-3.5 h-3.5 text-button-accent" /> Formato
                        </h3>
                        <select
                            value={filters.type}
                            onChange={e => updateFilter('type', e.target.value)}
                            className="w-full bg-bg-secondary border-2 border-border-color rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-button-accent transition-all cursor-pointer appearance-none"
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
                                <span className="text-xs bg-button-accent text-text-on-primary font-bold px-2 py-0.5 rounded-full">
                                    {filters.genres.length}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {GENRES.map(g => {
                                const isSelected = filters.genres.includes(g.id);
                                return (
                                    <motion.button
                                        key={g.id}
                                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => handleGenreToggle(g.id)}
                                        className={`text-sm px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                                            isSelected
                                                ? 'bg-button-accent border-button-accent text-text-on-primary'
                                                : 'bg-bg-secondary border-border-color text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        {g.name}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <motion.button
                            onClick={clearFilters}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-bold uppercase tracking-wider"
                        >
                            <Trash2 className="w-4 h-4" /> Limpar Filtros
                        </motion.button>
                    )}
                </aside>

                {/* ── Área Principal ─────────────────────────────────────────── */}
                <div className="flex-1 min-w-0">

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-5 bg-bg-secondary border border-border-color rounded-2xl shadow-xl shadow-shadow-color/10">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowMobileFilters(true)}
                                className="lg:hidden p-2.5 bg-button-accent text-text-on-primary rounded-lg shadow-lg shadow-button-accent/20"
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                            <span className="text-base text-text-secondary">
                                <strong className="text-text-primary text-lg">{filteredLibrary.length}</strong> animes na lista
                            </span>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <ViewToggle
                                value={viewMode}
                                onChange={setViewMode}
                                options={[
                                    { value: 'grid', label: '', icon: LayoutGrid },
                                    { value: 'list', label: '', icon: List },
                                ]}
                            />

                            <span className="text-sm font-medium text-text-secondary hidden sm:inline whitespace-nowrap pl-2 border-l border-border-color">
                                Ordenar por:
                            </span>
                            <div className="relative w-full sm:w-auto">
                                <select
                                    className="w-full sm:w-auto appearance-none bg-bg-tertiary border-2 border-border-color text-text-primary pl-4 pr-12 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:border-button-accent cursor-pointer hover:bg-bg-secondary transition-colors"
                                    value={filters.orderBy}
                                    onChange={e => updateFilter('orderBy', e.target.value)}
                                >
                                    <option value="recent_updated">🕒 Editados Recentemente</option>
                                    <option value="oldest_updated">🦕 Editados Antigos</option>
                                    <option value="score">⭐ Nota</option>
                                    <option value="title_asc">🔤 Título (A-Z)</option>
                                    <option value="title_desc">🔤 Título (Z-A)</option>
                                    <option value="favorites">❤️ Favoritos Primeiro</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Grid / List */}
                    <motion.div
                        className={viewMode === 'grid'
                            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
                            : 'flex flex-col gap-4'
                        }
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        key={`${viewMode}-${JSON.stringify(filters)}-${filteredLibrary.length}`}
                    >
                        <AnimatePresence mode="popLayout">
                            {filteredLibrary.map(anime => (
                                <motion.div
                                    key={anime.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                    layout
                                >
                                    {viewMode === 'grid' ? (
                                        <AnimeCard
                                            {...anime}
                                            image={anime.image || anime.smallImage}
                                            /* sem onRemove = read-only */
                                        />
                                    ) : (
                                        <AnimeListItem
                                            {...anime}
                                            image={anime.image || anime.smallImage}
                                            showPersonalProgress
                                            /* sem onRemove = read-only */
                                        />
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {/* Empty State */}
                    {filteredLibrary.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-bg-secondary rounded-full flex items-center justify-center mb-6 shadow-inner">
                                <LibraryIcon className="w-10 h-10 text-text-secondary opacity-40" />
                            </div>
                            <h3 className="text-2xl font-bold text-text-primary mb-2">
                                {hasActiveFilters ? 'Nenhum anime encontrado' : 'Biblioteca vazia'}
                            </h3>
                            <p className="text-text-secondary mb-6">
                                {hasActiveFilters
                                    ? 'Tente ajustar seus filtros.'
                                    : `${profile.displayName} ainda não adicionou nenhum anime.`
                                }
                            </p>
                            {hasActiveFilters && (
                                <motion.button
                                    onClick={clearFilters}
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    className="px-6 py-3 bg-button-accent text-text-on-primary rounded-xl font-bold transition-all shadow-lg"
                                >
                                    Limpar filtros
                                </motion.button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
