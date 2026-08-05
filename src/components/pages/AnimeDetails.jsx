import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Star, Users, Trophy, Heart, Film, List, ZoomIn, X
} from 'lucide-react';

import { useAnimeInfo } from '@/hooks/useAnimeInfo';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAnimeLibrary } from '@/hooks/useAnimeLibrary';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { Loader } from '@/components/ui/Loader';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Extracted Components
import { HeroActionCard } from '@/components/anime/HeroActionCard';
import { InfoRow } from '@/components/anime/InfoRow';
import { StatsCard } from '@/components/anime/StatsCard';
import { EpisodesList } from '@/components/anime/EpisodesList';
import { AnimeSidebar } from '@/components/anime/AnimeSidebar';
import { AnimeRelations } from '@/components/anime/AnimeRelations';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export function AnimeDetails() {
    const { id } = useParams();
    console.log(`[AnimeDetails] Component rendering for ID: ${id}`);

    const { anime, characters, recommendations, staff, loading, extrasLoading, error } = useAnimeInfo(id);
    console.log(`[AnimeDetails] useAnimeInfo result -> loading: ${loading}, animeExists: ${!!anime}, errorExists: ${!!error}`);
    
    const { user } = useAuth();
    const { toast } = useToast();
    const { library, addToLibrary, updateProgress, updateStatus, updateRating, toggleFavorite, removeFromLibrary } = useAnimeLibrary();

    usePageTitle(anime?.title || 'Detalhes');

    const libraryEntry = library.find(a => a.id.toString() === id);
    const status = libraryEntry?.status || 'plan_to_watch';
    const currentEp = Math.max(0, Number(libraryEntry?.currentEp) || 0);
    const totalEp = Math.max(0, Number(anime?.episodes) || 0);

    const [isVisible, setIsVisible] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [isZoomOpen, setIsZoomOpen] = useState(false);

    // Scroll to top whenever the ID changes (e.g. clicking a Relation or Recommendation)
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleRemoveConfirm = async () => {
        if (libraryEntry) {
            await removeFromLibrary(libraryEntry.id);
            toast.success("Anime removido da biblioteca.");
        }
    };

    const handleStatusChange = (newStatus) => {
        if (!user) {
            toast.warning("Faça login para salvar animes na sua lista!");
            return Promise.resolve(false);
        }

        if (libraryEntry) {
            return updateStatus(libraryEntry.id, newStatus, totalEp);
        }

        return addToLibrary(anime, newStatus);
    };

    if (loading) {
        console.log(`[AnimeDetails] Rendering loading state for ID: ${id}`);
        return (

            <div className="flex h-[80vh] items-center justify-center">
                <Loader />
            </div>

        );
    }

    if (error) {
        console.error(`[AnimeDetails] Rendering error state for ID: ${id}`, error);
        return (
            <div className="flex bg-bg-primary text-text-primary items-center justify-center h-screen">
                <p>Erro ao carregar anime: {error?.message || "Erro desconhecido"}</p>
            </div>
        );
    }

    if (!anime) {
        console.warn(`[AnimeDetails] Rendering Not Found state for ID: ${id}`);
        return (
            <div className="flex bg-bg-primary text-text-primary items-center justify-center h-screen">
                <p>Anime não encontrado.</p>
            </div>
        );
    }

    console.log(`[AnimeDetails] Rendering full page for ID: ${id}, Title: ${anime.title}`);
    const bannerImage = anime.banner || anime.image;

    return (

        <div className="min-h-screen bg-bg-primary text-text-primary font-sans selection:bg-primary selection:text-white pb-20">

            {/* --- HERO SECTION --- */}
            <motion.section
                data-header-hero
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="relative w-full min-h-[50vh] lg:h-[65vh] flex items-end"
            >
                {/* Background & Gradients */}
                <div className="absolute inset-x-0 -top-20 bottom-0 z-0 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center blur-sm scale-105"
                        style={{ backgroundImage: `url('${bannerImage}')` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-bg-primary via-bg-primary/50 to-transparent z-10" />
                </div>

                {/* Conteúdo do Hero */}
                <div className="relative z-20 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pb-8 lg:pb-16">
                    <div className={`grid lg:grid-cols-12 gap-8 items-end transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                        {/* Poster (Mobile: Visible / Desktop: Visible) */}
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="lg:col-span-3 xl:col-span-2 order-2 lg:order-1 flex justify-center lg:block mb-6 lg:mb-0"
                        >
                            <div
                                onClick={() => setIsZoomOpen(true)}
                                className="w-48 sm:w-64 lg:w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-bg-secondary relative group cursor-zoom-in"
                            >
                                <img src={anime.images?.jpg?.large_image_url || anime.image} alt={anime.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ZoomIn className="w-12 h-12 text-white drop-shadow-lg" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Info Principal */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="lg:col-span-6 xl:col-span-7 flex flex-col gap-4 order-1 lg:order-2 mb-6 lg:mb-0 text-center lg:text-left items-center lg:items-start pt-6 lg:pt-0"
                        >
                            {/* Badges */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                                <span className="px-3 py-1 rounded-lg bg-primary text-text-on-primary text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
                                    {anime.type || 'TV'}
                                </span>
                                <span className="px-3 py-1 rounded-lg bg-bg-tertiary border border-border-color text-xs font-bold uppercase tracking-wider">
                                    {anime.year || 'Unknown'}
                                </span>
                                {anime.status && (
                                    <span className={clsx(
                                        "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border backdrop-blur-md",
                                        anime.status === 'Finished Airing'
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                    )}>
                                        {anime.status === 'Finished Airing' ? 'Completo' : 'Em Lançamento'}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-text-primary drop-shadow-2xl">
                                {anime.title}
                            </h1>
                            {anime.title_english && (
                                <h2 className="text-lg md:text-xl text-text-secondary font-medium">{anime.title_english}</h2>
                            )}

                            <p className="text-text-secondary text-sm md:text-base leading-relaxed max-w-3xl line-clamp-3 md:line-clamp-4">
                                {anime.synopsis}
                            </p>
                        </motion.div>

                        {/* Card de Ação (Desktop: Right / Mobile: Below) */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="lg:col-span-3 flex flex-col justify-end order-3 lg:order-3 w-full"
                        >
                            <HeroActionCard
                                anime={anime}
                                libraryEntry={libraryEntry}
                                status={status}
                                handleStatusChange={handleStatusChange}
                                updateProgress={updateProgress}
                                updateRating={updateRating}
                                toggleFavorite={toggleFavorite}
                                currentEp={currentEp}
                                totalEp={totalEp}
                                onRemove={() => setIsRemoveModalOpen(true)}
                            />
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            {/* Remove Confirmation Modal */}
            <ConfirmationModal
                isOpen={isRemoveModalOpen}
                onClose={() => setIsRemoveModalOpen(false)}
                onConfirm={handleRemoveConfirm}
                title="Remover da Biblioteca"
                message={`Tem certeza que deseja remover "${anime.title}" da sua biblioteca? Todo o seu progresso será perdido.`}
                confirmText="Remover"
                isDestructive
            />

            {/* --- CONTEÚDO PRINCIPAL --- */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
                {/* MOBILE STATS (Visible only on mobile/tablet) */}
                <div className="lg:hidden mb-8">
                     <div className="grid grid-cols-2 gap-3">
                        <StatsCard value={`#${anime.rank || '-'}`} label="Ranking" icon={Trophy} />
                        <StatsCard value={anime.score || '-'} label="Score Médio" icon={Star} color="text-yellow-500" />
                        <StatsCard value={anime.popularity || '-'} label="Popularidade" icon={Heart} color="text-red-500" />
                        <StatsCard value={anime.members?.toLocaleString() || '-'} label="Membros" icon={Users} color="text-blue-500" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* DIREITA (Conteúdo) --> Agora na ESQUERDA (Desktop) */}
                    {/* DIREITA (Conteúdo) --> Agora na ESQUERDA (Desktop) */}
                    <div className="lg:col-span-9 xl:col-span-9 space-y-12 order-2 lg:order-1">

                        {/* Stats Grid */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="hidden lg:grid grid-cols-2 md:grid-cols-4 gap-4"
                        >
                            <StatsCard value={`#${anime.rank || '-'}`} label="Ranking" icon={Trophy} />
                            <StatsCard value={anime.score || '-'} label="Score Médio" icon={Star} color="text-yellow-500" />
                            <StatsCard value={anime.popularity || '-'} label="Popularidade" icon={Heart} color="text-red-500" />
                            <StatsCard value={anime.members?.toLocaleString() || '-'} label="Membros" icon={Users} color="text-blue-500" />
                        </motion.div>

                        {/* Trailer */}
                        {anime.trailer && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Film className="w-5 h-5 text-primary" /> Trailer</h3>
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg cursor-pointer"
                                >
                                    <iframe
                                        src={anime.trailer.replace("autoplay=1", "autoplay=0")}
                                        title="Trailer"
                                        className="w-full h-full"
                                        allowFullScreen
                                    />
                                </motion.div>
                            </motion.section>
                        )}

                        {/* Episódios */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2"><List className="w-5 h-5 text-primary" /> Episódios</h3>
                                {anime.episodesList?.length > 0 && (
                                    <span className="text-xs font-medium text-text-secondary bg-bg-secondary px-2 py-1 rounded-lg border border-border-color">
                                        {anime.episodesList.length} disponíveis
                                    </span>
                                )}
                            </div>

                            {extrasLoading ? (
                                <div className="p-8 text-center bg-bg-secondary rounded-xl border border-border-color">
                                    <p className="text-text-secondary">Carregando episódios...</p>
                                </div>
                            ) : anime.episodesList && anime.episodesList.length > 0 ? (
                                <EpisodesList
                                    episodes={anime.episodesList}
                                    currentEp={currentEp}
                                    totalEp={totalEp}
                                    onUpdateProgress={(epNum) => {
                                        if (user) {
                                            updateProgress(anime.id, epNum, totalEp);
                                            if (!libraryEntry) addToLibrary(anime, 'watching');
                                        } else {
                                            toast.warning("Faça login para marcar episódios!");
                                        }
                                    }}
                                />
                            ) : (
                                <div className="p-8 text-center bg-bg-secondary rounded-xl border border-border-color">
                                    <p className="text-text-secondary">Informações de episódios indisponíveis no momento.</p>
                                </div>
                            )}
                        </motion.section>

                        {/* Relações (Temporadas / Franquia) */}
                        <AnimeRelations relations={anime.relations} />

                        {/* Recomendações */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-primary" /> Recomendações</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {recommendations?.slice(0, 5).map(rec => (
                                    <Link to={`/anime/${rec.entry.mal_id}`} key={rec.entry.mal_id} className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-bg-secondary" onClick={() => window.scrollTo(0, 0)}>
                                        <img
                                            src={rec.entry.images?.webp?.large_image_url || rec.entry.images?.jpg?.large_image_url || rec.entry.images?.jpg?.image_url}
                                            alt={rec.entry.title_english || rec.entry.title}
                                            loading="lazy"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/95 via-black/15 to-transparent p-3">
                                            <span className="text-xs font-bold leading-snug text-white line-clamp-2 drop-shadow-md">
                                                {rec.entry.title_english || rec.entry.title}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </motion.section>

                        {/* Comentários */}
                        <div className="pt-8 border-t border-border-color">
                            <CommentsSection animeId={anime.id} />
                        </div>

                    </div>

                    {/* ESQUERDA (Info Sidebar) --> Agora na DIREITA (Desktop) */}
                    <AnimeSidebar anime={anime} characters={characters} staff={staff} />
                </div>
            </div >
            {/* Image Zoom Modal */}
            <AnimatePresence>
                {isZoomOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsZoomOpen(false)}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                    >
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.image}
                            alt={anime.title}
                            className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
                        />
                        <button
                            onClick={() => setIsZoomOpen(false)}
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <X className="w-8 h-8" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >

    );
}

