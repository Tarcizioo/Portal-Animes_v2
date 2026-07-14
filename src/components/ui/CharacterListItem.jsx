import { Heart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export function CharacterListItem({ character, rank }) {

    // Rank logic for Gold/Silver/Bronze
    const getRankStyle = (r) => {
        if (!r) return null;
        if (r === 1) return "bg-gradient-to-br from-yellow-300 to-yellow-600 border-yellow-200 text-yellow-950 shadow-yellow-500/30";
        if (r === 2) return "bg-gradient-to-br from-slate-200 to-slate-400 border-white text-slate-900 shadow-slate-400/30";
        if (r === 3) return "bg-gradient-to-br from-amber-600 to-amber-800 border-amber-500 text-amber-50 shadow-amber-700/30";
        return "bg-bg-tertiary border-border-color text-text-secondary";
    };

    const rankStyle = getRankStyle(rank);
    return (
        <Link
            to={`/character/${character.mal_id}`}
            className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 sm:p-5 bg-bg-secondary hover:bg-bg-tertiary rounded-2xl md:rounded-3xl border border-transparent hover:border-border-color transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1"
        >
            <div className="flex items-center gap-4">
                {/* Rank Badge */}
                {rank && (
                    <div className="flex-shrink-0 w-12 flex justify-center">
                        <span className={clsx(
                            "flex items-center justify-center font-black text-sm md:text-base border shadow-md w-10 h-10 md:w-12 md:h-12 rounded-full",
                            rankStyle,
                            rank <= 3 ? "scale-110" : ""
                        )}>
                            #{rank}
                        </span>
                    </div>
                )}

                {/* Avatar */}
                <div className="w-16 h-24 sm:w-20 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden shadow-md relative border border-white/5">
                    <img
                        src={character.images?.jpg?.image_url}
                        alt={character.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4 mb-1">
                    <h3 className="text-xl md:text-2xl font-black text-text-primary group-hover:text-primary transition-colors truncate">
                        {character.name}
                    </h3>
                    
                    {/* Favorite count for list view */}
                    <div className="flex items-center gap-1.5 text-sm font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg w-fit">
                        <Heart className="w-4 h-4 fill-current" />
                        <span>{character.favorites?.toLocaleString()}</span>
                    </div>
                </div>
                
                <p className="text-sm font-medium text-text-secondary/60 truncate mb-3 border border-border-color bg-bg-tertiary w-fit px-2 py-0.5 rounded-md">
                    {character.name_kanji || 'Nenhum kanji'}
                </p>

                {/* About / Bio */}
                <p className="text-sm text-text-secondary line-clamp-2 md:line-clamp-3 leading-relaxed">
                    {character.about
                        ? character.about.replace(/\\n/g, ' ')
                        : "Sem informações detalhadas disponíveis sobre este personagem épico da comunidade no momento."}
                </p>
            </div>

            {/* View Details Icon / Button */}
            <div className="hidden sm:flex self-center px-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-bg-tertiary text-text-secondary group-hover:bg-primary group-hover:text-white transition-all shadow-sm group-hover:shadow-primary/30 group-hover:scale-110">
                    <ChevronRight className="w-5 h-5" />
                </div>
            </div>
        </Link>
    );
}
