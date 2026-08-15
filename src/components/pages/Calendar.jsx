import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCalendar } from '@/hooks/useCalendar';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Calendar as CalendarIcon, Clock, Filter, LayoutGrid, List, ChevronDown } from 'lucide-react';
import { AnimeCard } from '@/components/ui/AnimeCard';
import { AnimeListItem } from '@/components/ui/AnimeListItem';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { ViewToggle } from '@/components/ui/ViewToggle';
import clsx from 'clsx';

const DAYS_OF_WEEK = [
    { value: 'monday', label: 'Segunda', short: 'Seg' },
    { value: 'tuesday', label: 'Terça', short: 'Ter' },
    { value: 'wednesday', label: 'Quarta', short: 'Qua' },
    { value: 'thursday', label: 'Quinta', short: 'Qui' },
    { value: 'friday', label: 'Sexta', short: 'Sex' },
    { value: 'saturday', label: 'Sábado', short: 'Sáb' },
    { value: 'sunday', label: 'Domingo', short: 'Dom' },
];

export function Calendar() {
    // Set initial day to today based on user's timezone
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const initialDay = DAYS_OF_WEEK.find(d => d.value === today) ? today : 'monday';
    
    const [selectedDay, setSelectedDay] = useState(initialDay);
    const { animes, loading, error } = useCalendar(selectedDay);

    const [viewMode, setViewMode] = useState(() => {
        const saved = localStorage.getItem("anime_calendar_view_mode");
        return saved || "grid";
    });
    
    useEffect(() => {
        localStorage.setItem("anime_calendar_view_mode", viewMode);
    }, [viewMode]);

    const [sortBy, setSortBy] = useState("members"); // Default sort by popularity

    usePageTitle('Calendário de Lançamentos');

    // Local Sorting Logic since the API brings the whole schedule chunk at once
    const sortedAnimes = useMemo(() => {
        if (!animes) return [];
        let sorted = [...animes];

        switch (sortBy) {
            case "score":
                sorted.sort((a, b) => (b.score || 0) - (a.score || 0));
                break;
            case "az":
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case "za":
                sorted.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case "members":
            default:
                sorted.sort((a, b) => (b.members || 0) - (a.members || 0));
                break;
        }
        return sorted;
    }, [animes, sortBy]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
    };

    return (
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="mb-8 border-b border-border-color pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-2xl flex-shrink-0">
                        <CalendarIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight">
                            Calendário de Lançamentos
                        </h1>
                        <p className="text-text-secondary mt-1">
                            Acompanhe os novos episódios da temporada dia após dia.
                        </p>
                    </div>
                </div>

                {/* View Actions Bar */}
                <div className="flex flex-wrap items-center gap-4 bg-bg-secondary p-3 rounded-2xl border border-border-color shadow-sm w-full md:w-auto">
                    <ViewToggle
                        value={viewMode}
                        onChange={setViewMode}
                        options={[
                        { value: "grid", label: "", icon: LayoutGrid },
                        { value: "list", label: "", icon: List },
                        ]}
                    />

                    <div className="h-6 w-px bg-border-color hidden sm:block" />

                    <div className="relative group flex-1 md:flex-none">
                        <select
                            className="w-full appearance-none bg-bg-tertiary border border-border-color text-text-primary pl-4 pr-10 py-2 rounded-xl text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer transition-colors"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="members">Popularidade</option>
                            <option value="score">Maior Nota</option>
                            <option value="az">Ordem Alfabética (A-Z)</option>
                            <option value="za">Ordem Alfabética (Z-A)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Daily Filter Tabs - STRETCHED */}
            <div className="mb-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 w-full">
                    {DAYS_OF_WEEK.map((day) => {
                        const isActive = selectedDay === day.value;
                        return (
                            <button
                                key={day.value}
                                onClick={() => setSelectedDay(day.value)}
                                className={clsx(
                                    "px-4 py-3 rounded-xl font-bold transition-all duration-300 relative overflow-hidden text-sm flex items-center justify-center w-full",
                                    isActive
                                        ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                                        : "bg-bg-secondary text-text-secondary border border-border-color hover:bg-bg-tertiary hover:text-text-primary hover:border-text-secondary/20"
                                )}
                            >
                                <span className="relative z-10">{window.innerWidth < 640 && day.short ? day.short : day.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="calendarFilter"
                                        className="absolute inset-0 bg-primary z-0"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Display */}
            <div className="min-h-[50vh]">
                {error && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">Erro ao carregar lançamentos</h3>
                        <p className="text-text-secondary max-w-md mx-auto">Tivemos um problema de conexão com a API de animes. Tente novamente mais tarde.</p>
                        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-bg-secondary hover:bg-bg-tertiary rounded-xl font-medium transition-colors">
                            Tentar novamente
                        </button>
                    </div>
                )}

                {!error && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        key={selectedDay + viewMode + sortBy + (loading ? '-loading' : '-loaded')}
                        className={clsx(
                            viewMode === "grid" 
                            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
                            : "flex flex-col gap-4"
                        )}
                    >
                        {loading ? (
                            Array.from({ length: 12 }).map((_, i) => (
                                <motion.div key={i} variants={itemVariants}>
                                    {viewMode === "grid" ? (
                                        <SkeletonCard />
                                    ) : (
                                        <div className="h-48 bg-bg-secondary rounded-xl animate-pulse" />
                                    )}
                                </motion.div>
                            ))
                        ) : sortedAnimes.length > 0 ? (
                            <AnimatePresence mode="popLayout">
                                {sortedAnimes.map((anime) => (
                                    <motion.div
                                        key={anime.mal_id || anime.id}
                                        variants={itemVariants}
                                        layout
                                    >
                                        {viewMode === "grid" ? (
                                            <AnimeCard 
                                                id={anime.mal_id}
                                                title={anime.title}
                                                image={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url}
                                                score={anime.score}
                                                year={anime.year}
                                                status={anime.status || 'Em Exibição'}
                                                type={anime.type}
                                                genre={anime.genres?.[0]?.name}
                                            />
                                        ) : (
                                            <AnimeListItem
                                                id={anime.mal_id}
                                                title={anime.title}
                                                image={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url}
                                                score={anime.score}
                                                year={anime.year}
                                                status={anime.status || 'Em Exibição'}
                                                type={anime.type}
                                                synopsis={anime.synopsis}
                                                genres={anime.genres}
                                            />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                                <Filter className="w-12 h-12 text-text-secondary mb-4 opacity-50" />
                                <h3 className="text-xl font-bold text-text-primary mb-2">Nenhum anime encontrado</h3>
                                <p className="text-text-secondary">Parece não haver lançamentos agendados para este dia da semana.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
