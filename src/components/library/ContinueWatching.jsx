import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoaderCircle, Plus, Zap } from 'lucide-react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

export function ContinueWatching({ animes, onIncrement }) {
  const [updatingId, setUpdatingId] = useState(null);

  if (animes.length === 0) return null;

  const handleIncrement = async (anime) => {
    setUpdatingId(anime.id);
    try {
      await onIncrement(anime.id, anime.currentEp || 0, anime.totalEp || 0);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="mb-10" aria-labelledby="continue-watching-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <Zap className="h-4 w-4 fill-current" aria-hidden="true" />
            <span className="text-xs font-black uppercase tracking-[0.18em]">Retome de onde parou</span>
          </div>
          <h2 id="continue-watching-title" className="text-2xl font-black text-text-primary">Continue assistindo</h2>
        </div>
        <span className="hidden text-sm text-text-secondary sm:block">Atualize o progresso sem abrir os detalhes</span>
      </div>

      <div className="flex snap-x gap-4 overflow-x-auto pb-3 custom-scrollbar xl:grid xl:grid-cols-4 xl:overflow-visible">
        {animes.map((anime) => {
          const currentEpisode = anime.currentEp || 0;
          const totalEpisodes = anime.totalEp || 0;
          const progress = totalEpisodes > 0 ? Math.min(100, (currentEpisode / totalEpisodes) * 100) : 0;
          const isUpdating = updatingId === anime.id;

          return (
            <article key={anime.id} className="min-w-[280px] snap-start rounded-2xl border border-border-color bg-bg-secondary p-3 shadow-lg shadow-black/10 xl:min-w-0">
              <div className="flex gap-3">
                <Link to={`/anime/${anime.id}`} className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-bg-tertiary">
                  <ResponsiveImage src={anime.image} alt={anime.title} className="h-full w-full object-cover" sizes="80px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link to={`/anime/${anime.id}`} className="line-clamp-2 font-bold leading-tight text-text-primary hover:text-primary">
                    {anime.title}
                  </Link>
                  <span className="mt-2 text-xs text-text-secondary">
                    Episodio <strong className="text-text-primary">{currentEpisode}</strong> / {totalEpisodes || '?'}
                  </span>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-tertiary"
                    role="progressbar"
                    aria-label={`Progresso de ${anime.title}`}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={Math.round(progress)}
                  >
                    <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleIncrement(anime)}
                    disabled={updatingId !== null}
                    className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-black text-white transition-transform hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60"
                  >
                    {isUpdating ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    {isUpdating ? 'Salvando...' : '+1 episodio'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}