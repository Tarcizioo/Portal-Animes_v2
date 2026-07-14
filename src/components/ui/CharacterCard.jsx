import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export function CharacterCard({ character, rank }) {
    // Rank logic for Gold/Silver/Bronze
    const getRankStyle = (r) => {
        if (!r) return null;
        if (r === 1) return "bg-gradient-to-br from-yellow-300 to-yellow-600 text-yellow-950 shadow-yellow-500/50 border-yellow-200";
        if (r === 2) return "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 shadow-slate-400/50 border-white";
        if (r === 3) return "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50 shadow-amber-700/50 border-amber-500";
        return "bg-black/80 backdrop-blur-md text-white border-white/10";
    };

    const rankStyle = getRankStyle(rank);
    return (
        <Link
            to={`/character/${character.mal_id}`}
            className="block group relative w-full aspect-[2/3] md:aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-border-color hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20 bg-bg-secondary"
        >
            {/* Full Bleed Image */}
            <img
                src={character.images?.webp?.image_url || character.images?.jpg?.image_url}
                alt={character.name}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Premium Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Top Shine highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Top Info Bar: Rank & Kanji */}
            <div className="absolute top-0 w-full px-3 py-3 md:px-4 md:py-4 flex items-start justify-between z-10">
                {/* Rank Badge */}
                {rank && (
                    <div className={clsx(
                        "px-3 py-1.5 md:px-4 md:py-2 rounded-xl flex items-center justify-center font-black text-sm md:text-base border shadow-xl",
                        rankStyle,
                        rank <= 3 ? "scale-105" : ""
                    )}>
                        #{rank}
                    </div>
                )}

                {/* Vertical Kanji (Aesthetic touch) */}
                {character.name_kanji && (
                    <div className="hidden sm:flex ml-auto bg-black/40 backdrop-blur-sm px-2 py-3 rounded-lg border border-white/10 shadow-lg">
                        <span className="text-white/80 font-bold text-sm" style={{ writingMode: 'vertical-rl' }}>
                            {character.name_kanji}
                        </span>
                    </div>
                )}
            </div>

            {/* Bottom Info Footer */}
            <div className="absolute bottom-0 w-full p-4 md:p-5 flex flex-col z-20">
                
                {/* Favorites Float Badge */}
                <div className="flex items-center gap-1.5 self-start mb-3 bg-red-500/20 backdrop-blur-md border border-red-500/30 px-3 py-1.5 rounded-full text-red-100 font-bold text-xs shadow-md">
                    <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                    <span>{(character.favorites || 0).toLocaleString()}</span>
                </div>

                {/* Character Name */}
                <h3 
                    className="text-lg md:text-xl font-black text-white leading-tight drop-shadow-md group-hover:text-primary transition-colors" 
                    title={character.name}
                >
                    {character.name}
                </h3>
            </div>
        </Link>
    );
}
