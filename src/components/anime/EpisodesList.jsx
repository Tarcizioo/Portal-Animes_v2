import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { ChevronDown, CheckCircle } from 'lucide-react';

export function EpisodesList({ episodes, currentEp, onUpdateProgress }) {
    const [showAll, setShowAll] = useState(false);
    const displayedEpisodes = showAll ? episodes : episodes.slice(0, 5);

    return (
        <div className="space-y-3">
            <AnimatePresence mode='wait'>
                {displayedEpisodes.map((ep, index) => {
                    const isWatched = currentEp >= ep.mal_id;
                    const isFiller = ep.filler;

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            key={ep.mal_id}
                            className={clsx(
                                "relative overflow-hidden flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                                isWatched
                                    ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_-5px_var(--button-accent)]"
                                    : "bg-bg-secondary hover:bg-bg-tertiary border-border-color hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
                                isFiller && !isWatched && "border-orange-500/30 bg-orange-500/5"
                            )}
                            onClick={() => onUpdateProgress(ep.mal_id)}
                        >
                            {/* Subtle Glow Effect on Hover (Desktop) */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                            <div className="flex items-center gap-4 flex-1 min-w-0 z-10">
                                {/* Number Box */}
                                <div className={clsx(
                                    "size-12 flex-shrink-0 rounded-xl flex items-center justify-center font-black text-lg transition-all duration-300",
                                    isWatched ? "bg-primary text-white scale-110 shadow-lg shadow-primary/30" : "bg-bg-tertiary text-text-secondary group-hover:text-primary group-hover:scale-105",
                                    isFiller && !isWatched && "text-orange-400"
                                )}>
                                    {ep.mal_id}
                                </div>

                                {/* Text Info */}
                                <div className="flex flex-col min-w-0 gap-0.5">
                                    <span className={clsx(
                                        "font-bold truncate pr-4 text-base md:text-lg transition-colors duration-300",
                                        isWatched ? "text-primary" : "text-text-primary group-hover:text-primary",
                                        isFiller && "text-orange-400"
                                    )}>
                                        {ep.title}
                                        {isFiller && <span className="ml-2 text-[10px] uppercase border border-orange-500/50 text-orange-400 px-1.5 py-0.5 rounded-md font-bold tracking-wider">Filler</span>}
                                    </span>
                                    <span className="text-xs md:text-sm text-text-secondary truncate font-medium group-hover:text-text-primary transition-colors">
                                        {ep.title_japanese || ep.title_romanji}
                                        {ep.aired && <span className="opacity-50 mx-2">•</span>}
                                        {ep.aired ? new Date(ep.aired).toLocaleDateString() : ''}
                                    </span>
                                </div>
                            </div>

                            {/* Action Icon */}
                            <div className="pl-4 z-10">
                                <div className={clsx(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                                    isWatched ? "bg-primary text-white scale-110 rotate-0" : "border-2 border-text-secondary/30 text-transparent group-hover:border-primary group-hover:text-primary scale-100 rotate-180"
                                )}>
                                    <CheckCircle className={clsx("w-5 h-5", isWatched && "fill-white/20")} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {episodes.length > 5 && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-3 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl border border-dashed border-primary/30 hover:border-primary transition-colors flex items-center justify-center gap-2 mt-4"
                >
                    {showAll ? (
                        <>Mostrar menos <ChevronDown className="w-4 h-4 rotate-180" /></>
                    ) : (
                        <>Ver todos os {episodes.length} episódios <ChevronDown className="w-4 h-4" /></>
                    )}
                </motion.button>
            )}
        </div>
    );
}
