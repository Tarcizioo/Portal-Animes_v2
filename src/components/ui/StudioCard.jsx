import { Link } from 'react-router-dom';
import { StudioArtwork } from '@/components/ui/StudioArtwork';

export function StudioCard({ studio, rank }) {
    return (
        <Link to={`/studio/${studio.id || studio.mal_id}`} className="block group relative bg-bg-secondary rounded-2xl overflow-hidden shadow-sm border border-border-color hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            {/* Imagem */}
            <div className="aspect-[16/9] overflow-hidden relative">
                <StudioArtwork studio={studio} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />

                {/* Gradient Overlay for visual consistency */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Rank Number (if passed) */}
                {rank && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center justify-center border border-white/10 shadow-lg">
                        <span className="text-white font-bold text-sm">#{rank}</span>
                    </div>
                )}
            </div>

            {/* Info Footer */}
            <div className="p-4 bg-bg-secondary group-hover:bg-bg-tertiary transition-colors">
                <h3 className="text-base font-bold text-text-primary truncate mb-1" title={studio.title || studio.name}>
                    {studio.title || studio.name || 'Estúdio'}
                </h3>
            </div>
        </Link>
    );
}
