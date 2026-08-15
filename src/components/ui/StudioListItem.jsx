import { useNavigate } from 'react-router-dom';
import { StudioArtwork } from '@/components/ui/StudioArtwork';

export function StudioListItem({ studio, rank }) {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/studio/${studio.id || studio.mal_id}`)}
            className="group flex items-center gap-6 p-4 bg-bg-secondary hover:bg-bg-tertiary rounded-xl border border-transparent hover:border-border-color transition-all duration-300 cursor-pointer"
        >
            {/* Rank Badge */}
            {rank && (
                <div className="flex-shrink-0 w-12 text-center">
                    <span className="text-2xl font-black text-text-secondary/20 group-hover:text-primary/50 transition-colors">
                        #{rank}
                    </span>
                </div>
            )}

            {/* Avatar */}
            <div className="w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden shadow-sm relative">
                <StudioArtwork studio={studio} compact className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                    {studio.title || studio.name || 'Estúdio'}
                </h3>

                {/* About / Bio */}
                <p className="text-sm text-text-secondary/80 mt-1 line-clamp-2 leading-relaxed">
                    {studio.about
                        ? studio.about.replace(/\\n/g, ' ')
                        : "Sem informações disponíveis sobre este estúdio."}
                </p>
            </div>

            {/* View Details Button (Desktop) */}
            <div className="hidden md:block">
                <button className="px-4 py-2 rounded-lg bg-bg-primary text-text-primary text-sm font-medium border border-border-color group-hover:border-primary group-hover:text-primary transition-all">
                    Ver Detalhes
                </button>
            </div>
        </div>
    );
}
