import { Star, Users, Calendar, MonitorPlay, Film, PlayCircle, CheckCircle, Clock, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

export function AnimeListItem({
    id, title, image, smallImage, score, synopsis, status, year, episodes, totalEp, type, genres,
    showPersonalProgress, currentEp, userScore, onRemove, role
}) {
    // Truncate synopsis
    const truncatedSynopsis = synopsis?.length > 200 ? synopsis.substring(0, 200) + "..." : synopsis;

    // Status Logic
    const getStatusInfo = (s) => {
        const normalized = s?.toLowerCase()?.replace(/\s/g, '_');
        switch (normalized) {
            case 'currently_airing':
            case 'airing':
            case 'watching':
                return { label: 'Assistindo / Lançando', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: PlayCircle };
            case 'finished_airing':
            case 'completed':
                return { label: 'Completo', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: CheckCircle };
            case 'upcoming':
            case 'plan_to_watch':
                return { label: 'Planejo', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', icon: Clock };
            case 'dropped':
                return { label: 'Dropado', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: X };
            default:
                return { label: s || 'Desconhecido', color: 'text-text-secondary bg-bg-tertiary border-border-color', icon: null };
        }
    };

    const statusInfo = getStatusInfo(status);
    const StatusIcon = statusInfo.icon;

    // Progress Calculation
    const totalEpisodes = totalEp || episodes || 0;
    const progressPercentage = totalEpisodes > 0 ? ((currentEp || 0) / totalEpisodes) * 100 : 0;

    return (
        <Link
            to={`/anime/${id}`}
            className="group relative flex flex-row gap-3 sm:gap-4 bg-bg-secondary hover:bg-bg-tertiary border border-border-color rounded-xl p-3 hover:border-button-accent transition-all hover:shadow-lg hover:shadow-button-accent/5 overflow-hidden"
        >
            {/* Background Gradient on Hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-button-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Poster - Fixed width for mobile and desktop */}
            <div className="shrink-0 w-24 sm:w-[100px] aspect-[2/3] rounded-lg overflow-hidden relative shadow-md">
                <ResponsiveImage
                    src={image}
                    fallbackSrc={smallImage}
                    srcSet={smallImage && smallImage !== image ? `${smallImage} 160w, ${image} 320w` : undefined}
                    sizes="(max-width: 639px) 96px, 100px"
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />
                {/* Only show Global Score overlay if NOT personal progress context, or if we want both. 
                     For list view, clean is better. Let's keep global score if provided and not personal. */}
                {!showPersonalProgress && score > 0 && (
                    <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-white flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {score}
                    </div>
                )}
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col min-w-0 py-0.5 relative z-10">

                {/* Header: Title & Status (and optional Remove button) */}
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-text-primary group-hover:text-button-accent transition-colors line-clamp-2 sm:line-clamp-1 leading-tight">
                        {title}
                    </h3>

                    <div className="flex items-center gap-2">
                        {/* Role Badge (Custom for Character Details) */}
                        {role && (
                            <span className={clsx(
                                "hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0",
                                role === 'Main' ? "bg-primary text-white" : "bg-bg-tertiary text-text-secondary border border-border-color"
                            )}>
                                {role === 'Main' ? 'MAIN' : 'SUPP'}
                            </span>
                        )}

                        {/* Status Icon */}
                        {status && (
                            <div className={clsx("hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0", statusInfo.color)}>
                                {StatusIcon && <StatusIcon className="w-3 h-3" />}
                                {statusInfo.label}
                            </div>
                        )}

                        {/* Remove Button (Visible on hover in Desktop, always on mobile if enabled) */}
                        {onRemove && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onRemove();
                                }}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                title="Remover"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Status / Role (Compact) */}
                <div className="sm:hidden flex mb-1.5 gap-2">
                     {role && (
                        <span className={clsx(
                            "text-[10px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1",
                            role === 'Main' ? "bg-primary text-white" : "bg-bg-tertiary text-text-secondary border border-border-color"
                        )}>
                            {role === 'Main' ? 'MAIN' : 'SUPP'}
                        </span>
                    )}
                    {status && (
                        <span className={clsx("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border flex items-center gap-1", statusInfo.color)}>
                            {statusInfo.label}
                        </span>
                    )}
                </div>

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary mb-2">
                    {type && <span className="flex items-center gap-1"><MonitorPlay className="w-3 h-3" /> {type}</span>}
                    {year && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {year}</span>}
                    {totalEpisodes > 0 && <span className="flex items-center gap-1"><Film className="w-3 h-3" /> {totalEpisodes} eps</span>}
                </div>

                {/* Personal Progress Bar (Library Only) */}
                {showPersonalProgress && (
                    <div className="mb-2 sm:mb-4 bg-bg-tertiary/50 p-1.5 sm:p-2 rounded-lg">
                        <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold mb-1">
                            <span className="text-text-primary flex items-center gap-1">
                                <span className="hidden sm:inline">Progresso:</span> <span className="text-button-accent">{currentEp || 0}</span> / {totalEpisodes || '?'}
                            </span>
                            {(userScore || score) > 0 && (
                                <span className="flex items-center gap-1 text-yellow-500">
                                    <Star className="w-3 h-3 fill-current" /> {userScore || score}
                                </span>
                            )}
                        </div>
                        <div className="h-1 sm:h-1.5 w-full bg-bg-primary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-button-accent shadow-[0_0_10px_rgba(var(--button-accent),0.5)] transition-all duration-500"
                                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Synopsis (Non-Library or if space permits) */}
                {!showPersonalProgress && truncatedSynopsis && (
                    <p className="text-text-secondary text-xs leading-relaxed mb-auto line-clamp-2 hidden sm:block">
                        {truncatedSynopsis}
                    </p>
                )}

                {/* Genres (Bottom Row) */}
                <div className="mt-auto pt-1 flex flex-wrap gap-1">
                    {(() => {
                        let genresToRender = [];
                        if (Array.isArray(genres)) {
                            genresToRender = genres.map(g => typeof g === 'object' ? g.name : g);
                        } else if (typeof genres === 'string') {
                            genresToRender = genres.split(', ').filter(Boolean);
                        }

                        return genresToRender.slice(0, 3).map((g, i) => (
                            <span key={`${g}-${i}`} className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-bg-tertiary text-text-secondary border border-border-color/50">
                                {g}
                            </span>
                        ));
                    })()}
                </div>
            </div>
        </Link>
    );
}
