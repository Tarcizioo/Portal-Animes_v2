import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, LoaderCircle, Plus, Zap } from 'lucide-react';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

export function ContinueWatchingSkeleton({ variant = 'default' }) {
  const isHome = variant === 'home';

  return (
    <section className={isHome ? 'space-y-4' : 'mb-10 space-y-4'} aria-label="Carregando progresso" aria-busy="true">
      <div className="h-8 w-64 max-w-[75%] animate-pulse rounded-lg bg-bg-tertiary" />
      <div className="flex min-h-36 animate-pulse overflow-hidden rounded-2xl border border-border-color bg-bg-secondary/70">
        <div className="w-24 shrink-0 bg-bg-tertiary sm:w-32" />
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="h-5 w-2/3 rounded bg-bg-tertiary" />
          <div className="h-4 w-1/3 rounded bg-bg-tertiary" />
          <div className="mt-auto h-2 w-full rounded-full bg-bg-tertiary" />
          <div className="h-11 w-28 self-end rounded-xl bg-bg-tertiary" />
        </div>
      </div>
    </section>
  );
}

export function ContinueWatchingEmpty({ actionHref = '/discover' }) {
  return (
    <section aria-labelledby="continue-watching-empty-title" className="space-y-4">
      <h2 id="continue-watching-empty-title" className="text-xl font-black text-text-primary sm:text-2xl">
        Continue acompanhando
      </h2>
      <div className="flex items-center gap-4 rounded-2xl border border-border-color bg-bg-secondary/70 p-4 shadow-lg shadow-black/5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary" aria-hidden="true">
          <Compass className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-text-primary">Nenhum progresso em andamento</p>
          <p className="mt-1 text-sm text-text-secondary">Encontre um anime e registre seus episódios para acompanhar por aqui.</p>
        </div>
        <Link
          to={actionHref}
          className="hidden min-h-11 shrink-0 items-center rounded-xl border border-border-color px-4 text-sm font-bold text-primary transition-colors hover:border-primary sm:inline-flex"
        >
          Descobrir
        </Link>
      </div>
    </section>
  );
}

export function ContinueWatching({ animes = [], onIncrement, variant = 'default', viewAllHref }) {
  const [updatingIds, setUpdatingIds] = useState(() => new Set());
  const generatedId = useId();
  const headingId = `continue-watching-${generatedId}`;
  const isHome = variant === 'home';

  if (animes.length === 0) return null;

  const handleIncrement = async (anime) => {
    const animeId = String(anime.id);
    setUpdatingIds((current) => new Set(current).add(animeId));
    try {
      await onIncrement(anime.id, anime.currentEp || 0, anime.totalEp || 0);
    } finally {
      setUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(animeId);
        return next;
      });
    }
  };

  return (
    <section className={isHome ? '' : 'mb-10'} aria-labelledby={headingId}>
      <div className="mb-4 flex items-center justify-between gap-4 px-1">
        <div>
          <div className="mb-1 hidden items-center gap-2 text-primary sm:flex">
            <Zap className="h-4 w-4 fill-current" aria-hidden="true" />
            <span className="text-xs font-black uppercase tracking-[0.18em]">Retome de onde parou</span>
          </div>
          <h2 id={headingId} className="text-xl font-black text-text-primary sm:text-2xl">Continue acompanhando</h2>
        </div>
        {viewAllHref ? (
          <Link
            to={viewAllHref}
            className="inline-flex min-h-11 shrink-0 items-center rounded-xl px-2 text-sm font-bold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Ver tudo
          </Link>
        ) : (
          <span className="hidden text-sm text-text-secondary sm:block">Atualize o progresso sem abrir os detalhes</span>
        )}
      </div>

      <div className={`no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 ${isHome ? 'xl:grid xl:grid-cols-2 xl:overflow-visible 2xl:grid-cols-4' : 'xl:grid xl:grid-cols-4 xl:overflow-visible'}`}>
        {animes.map((anime) => {
          const currentEpisode = anime.currentEp || 0;
          const totalEpisodes = anime.totalEp || 0;
          const progress = totalEpisodes > 0 ? Math.min(100, (currentEpisode / totalEpisodes) * 100) : 0;
          const remainingEpisodes = totalEpisodes > 0 ? Math.max(0, totalEpisodes - currentEpisode) : null;
          const isUpdating = updatingIds.has(String(anime.id));

          return (
            <article
              key={anime.id}
              className={`${isHome ? 'min-w-full sm:min-w-[30rem]' : 'min-w-[280px]'} snap-start overflow-hidden rounded-2xl border border-border-color bg-bg-secondary shadow-lg shadow-black/10 xl:min-w-0`}
            >
              <div className="flex min-h-32">
                <Link
                  to={`/anime/${anime.id}`}
                  aria-label={`Ver detalhes de ${anime.title}`}
                  className={`${isHome ? 'h-auto w-24 sm:w-32' : 'm-3 h-28 w-20 rounded-xl'} shrink-0 overflow-hidden bg-bg-tertiary`}
                >
                  <ResponsiveImage src={anime.image} alt="" className="h-full w-full object-cover" sizes={isHome ? '(max-width: 639px) 96px, 128px' : '80px'} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                  <Link
                    to={`/anime/${anime.id}`}
                    title={anime.title}
                    className={`${isHome ? 'line-clamp-1 sm:line-clamp-2' : 'line-clamp-2'} font-bold leading-tight text-text-primary hover:text-primary`}
                  >
                    {anime.title}
                  </Link>
                  <span className="mt-2 text-xs text-text-secondary sm:text-sm">
                    Episódio <strong className="text-text-primary">{currentEpisode}</strong> de {totalEpisodes || '?'}
                  </span>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-tertiary sm:mt-3"
                    role="progressbar"
                    aria-label={`Progresso de ${anime.title}`}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={Math.round(progress)}
                  >
                    <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                    <span className="text-[11px] leading-tight text-text-secondary sm:text-sm">
                      {remainingEpisodes === null
                        ? 'Total de episódios em atualização'
                        : `${remainingEpisodes} ${remainingEpisodes === 1 ? 'episódio restante' : 'episódios restantes'}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleIncrement(anime)}
                      disabled={isUpdating || (totalEpisodes > 0 && currentEpisode >= totalEpisodes)}
                      aria-label={`Adicionar um episódio ao progresso de ${anime.title}`}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-black text-text-on-primary shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-secondary disabled:cursor-wait disabled:opacity-60 sm:px-4 sm:text-sm"
                    >
                      {isUpdating ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Plus aria-hidden="true" className="h-4 w-4" />}
                      <span aria-live="polite">{isUpdating ? 'Salvando...' : isHome ? '+1 episódio' : '+1 ep'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
